<?php

namespace Tests\Feature\Security;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AbuseTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
    }

    private function orderBasics(): array
    {
        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create(['price_per_unit' => 10000]);

        return [$customer, $service];
    }

    public function test_mass_assignment_diabaikan(): void
    {
        [$customer, $service] = $this->orderBasics();
        $tenantB = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $response = $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
            'status' => 'completed',
            'ticket' => 'PALSU-00000000-999',
            'total' => 1,
            'tenant_id' => $tenantB->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'received')
            ->assertJsonPath('data.total', 10000);
        $this->assertDoesNotMatchRegularExpression('/^PALSU/', $response->json('data.ticket'));
        $this->assertDatabaseMissing('orders', ['ticket' => 'PALSU-00000000-999']);
    }

    public function test_upload_php_ditolak(): void
    {
        [$customer, $service] = $this->orderBasics();
        $manager = User::factory()->forTenant($this->tenant)->withRole(Role::Manager)->create();
        $driver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $orderId = $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->json('data.id');

        Sanctum::actingAs($manager);
        $taskId = $this->postJson('/api/v1/delivery-tasks', [
            'order_id' => $orderId,
            'type' => 'pickup',
            'scheduled_at' => now()->addDay()->toIso8601String(),
            'driver_id' => $driver->id,
        ])->json('data.id');

        Sanctum::actingAs($driver);
        $this->postJson("/api/v1/delivery-tasks/{$taskId}/proof", [
            'proof' => UploadedFile::fake()->create('shell.php', 100, 'application/x-php'),
        ])->assertStatus(422);
    }

    public function test_injeksi_sql_di_pencarian_netral(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create());

        $this->getJson('/api/v1/customers?q='."' OR '1'='1")->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/orders?q=%27%20OR%201%3D1%20--')->assertOk();
    }

    public function test_per_page_dibatasi_seratus(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create());
        Customer::factory()->forTenant($this->tenant)->count(5)->create();

        $this->getJson('/api/v1/customers?per_page=500')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 100);
    }

    public function test_respons_tidak_membocorkan_field_sensitif(): void
    {
        $user = User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create();
        Sanctum::actingAs($user);

        $keys = array_keys($this->getJson('/api/v1/auth/me')->json('user'));
        sort($keys);

        $this->assertSame(['email', 'id', 'name', 'outlet_id', 'role', 'tenant_id'], $keys);
    }
}

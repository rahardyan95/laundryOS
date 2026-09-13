<?php

namespace Tests\Feature\Operations;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportTest extends TestCase
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

    private function seedOrder(): void
    {
        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create([
            'name' => 'Cuci Setrika',
            'price_per_unit' => 10000,
        ]);

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 2]],
            'payment_method' => 'cash',
            'paid_amount' => 20000,
        ])->assertCreated();
    }

    public function test_kasir_tidak_boleh_melihat_laporan(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $this->getJson('/api/v1/reports/summary')->assertForbidden();
    }

    public function test_summary_tanpa_auth_unauthorized(): void
    {
        $this->getJson('/api/v1/reports/summary')->assertUnauthorized();
    }

    public function test_summary_mengagregat_dengan_benar(): void
    {
        $this->seedOrder();
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create());

        $this->getJson('/api/v1/reports/summary')
            ->assertOk()
            ->assertJsonPath('data.revenue_total', 20000)
            ->assertJsonPath('data.orders_total', 1)
            ->assertJsonStructure(['data' => [
                'from', 'to', 'revenue_total', 'orders_total',
                'revenue_by_day', 'orders_by_status', 'top_services',
            ]]);
    }

    public function test_summary_menghormati_filter_outlet(): void
    {
        $this->seedOrder();
        $outletB = Outlet::factory()->forTenant($this->tenant)->create();
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create());

        $this->getJson("/api/v1/reports/summary?outlet_id={$outletB->id}")
            ->assertOk()
            ->assertJsonPath('data.orders_total', 0)
            ->assertJsonPath('data.revenue_total', 0);
    }

    public function test_csv_terdownload_dengan_isi_valid(): void
    {
        $this->seedOrder();
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Manager)->create());

        $response = $this->get('/api/v1/reports/sales.csv');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));

        $body = $response->streamedContent();
        $this->assertStringContainsString('ticket', $body);
        $this->assertStringContainsString('20000', $body);
    }
}

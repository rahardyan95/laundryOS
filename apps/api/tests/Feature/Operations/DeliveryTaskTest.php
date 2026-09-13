<?php

namespace Tests\Feature\Operations;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Operations\Models\DeliveryTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryTaskTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $manager;

    private User $driver;

    private int $orderId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $this->manager = User::factory()->forTenant($this->tenant)->withRole(Role::Manager)->create();
        $this->driver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();
        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create(['price_per_unit' => 10000]);

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->orderId = $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->json('data.id');
    }

    private function taskPayload(array $overrides = []): array
    {
        return array_merge([
            'order_id' => $this->orderId,
            'type' => 'pickup',
            'scheduled_at' => now()->addDay()->toIso8601String(),
            'address' => 'Jl. Contoh No. 1',
            'driver_id' => $this->driver->id,
        ], $overrides);
    }

    public function test_buat_task_dengan_penugasan_kurir(): void
    {
        Sanctum::actingAs($this->manager);

        $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'assigned')
            ->assertJsonPath('data.driver.id', $this->driver->id);
    }

    public function test_kasir_tidak_boleh_membuat_task(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->assertForbidden();
    }

    public function test_kurir_hanya_melihat_task_miliknya(): void
    {
        Sanctum::actingAs($this->manager);
        $mine = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        $otherDriver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();
        $this->postJson('/api/v1/delivery-tasks', $this->taskPayload(['driver_id' => $otherDriver->id]))
            ->assertCreated();

        Sanctum::actingAs($this->driver);
        $this->getJson('/api/v1/delivery-tasks')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine);
    }

    public function test_kurir_menyelesaikan_task_bertahap(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        Sanctum::actingAs($this->driver);
        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'in_progress'])->assertOk();
        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'done'])
            ->assertOk()
            ->assertJsonPath('data.status', 'done');

        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'in_progress'])->assertStatus(422);
    }

    public function test_driver_lain_tidak_boleh_mengubah_task(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create());
        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'in_progress'])->assertForbidden();
    }

    public function test_upload_bukti_menyimpan_file(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        Sanctum::actingAs($this->driver);
        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'in_progress'])->assertOk();
        $this->postJson("/api/v1/delivery-tasks/{$id}/status", ['status' => 'done'])->assertOk();

        $this->postJson("/api/v1/delivery-tasks/{$id}/proof", [
            'proof' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertOk()->assertJsonStructure(['data' => ['proof_url']]);

        $task = DeliveryTask::find($id);
        Storage::disk('public')->assertExists($task->proof_path);
    }

    public function test_task_tenant_lain_404(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        $tenantB = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenantB)->withRole(Role::Manager)->create());

        $this->getJson("/api/v1/delivery-tasks/{$id}")->assertNotFound();
    }

    public function test_update_jadwal_dan_kurir_oleh_manajer(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload(['driver_id' => null]))->json('data.id');

        $newDriver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();
        $scheduled = now()->addDays(2)->toIso8601String();

        $this->patchJson("/api/v1/delivery-tasks/{$id}", [
            'driver_id' => $newDriver->id,
            'scheduled_at' => $scheduled,
            'address' => 'Alamat Baru No. 9',
        ])
            ->assertOk()
            ->assertJsonPath('data.driver.id', $newDriver->id)
            ->assertJsonPath('data.address', 'Alamat Baru No. 9');
    }

    public function test_kasir_dan_kurir_tidak_boleh_update_task(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload())->json('data.id');

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->patchJson("/api/v1/delivery-tasks/{$id}", ['address' => 'X'])->assertForbidden();

        Sanctum::actingAs($this->driver);
        $this->patchJson("/api/v1/delivery-tasks/{$id}", ['address' => 'X'])->assertForbidden();
    }

    public function test_update_driver_bukan_kurir_ditolak(): void
    {
        Sanctum::actingAs($this->manager);
        $id = $this->postJson('/api/v1/delivery-tasks', $this->taskPayload(['driver_id' => null]))->json('data.id');

        $cashier = User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create();

        $this->patchJson("/api/v1/delivery-tasks/{$id}", ['driver_id' => $cashier->id])
            ->assertStatus(422);
    }
}

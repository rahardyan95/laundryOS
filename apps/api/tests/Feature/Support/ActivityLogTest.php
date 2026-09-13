<?php

namespace Tests\Feature\Support;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_order_mencatat_aktivitas_dengan_actor(): void
    {
        [$tenant, $outlet, $customer, $service, $owner] = $this->seedBasics();
        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ]);
        $response->assertCreated();

        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $tenant->id,
            'actor_id' => $owner->id,
            'action' => 'order.created',
            'subject_type' => Order::class,
            'subject_id' => $response->json('data.id'),
        ]);
    }

    public function test_ubah_status_mencatat_aktivitas(): void
    {
        [$tenant, $outlet, $customer, $service, $owner] = $this->seedBasics();
        Sanctum::actingAs($owner);

        $id = $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->json('data.id');

        $operator = User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole(Role::Operator)->create();
        Sanctum::actingAs($operator);
        $this->postJson("/api/v1/orders/{$id}/status")->assertOk();

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'order.status_changed',
            'actor_id' => $operator->id,
            'subject_id' => $id,
        ]);
    }

    /** @return array{Tenant, Outlet, Customer, Service, User} */
    private function seedBasics(): array
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outlet)->create();
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        $owner = User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole(Role::Owner)->create();

        return [$tenant, $outlet, $customer, $service, $owner];
    }
}

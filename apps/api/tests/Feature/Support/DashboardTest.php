<?php

namespace Tests\Feature\Support;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_summary_tanpa_auth_unauthorized(): void
    {
        $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();
    }

    public function test_kasir_tidak_boleh_melihat_dashboard(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create());

        $this->getJson('/api/v1/dashboard/summary')->assertForbidden();
    }

    public function test_summary_mengagregat_order_dengan_benar(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outlet)->create();
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        $owner = User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole(Role::Owner)->create();
        Sanctum::actingAs($owner);

        $payload = fn (int $paid) => [
            'outlet_id' => $outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 2]],
            'payment_method' => 'cash',
            'paid_amount' => $paid,
        ];

        $this->postJson('/api/v1/orders', $payload(20000))->assertCreated();
        $this->postJson('/api/v1/orders', $payload(0))->assertCreated();

        $this->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.orders_today', 2)
            ->assertJsonPath('data.sales_today', 40000)
            ->assertJsonPath('data.outstanding', 20000)
            ->assertJsonPath('data.cash_balance', 20000);
    }

    public function test_summary_menghormati_filter_outlet(): void
    {
        $tenant = Tenant::factory()->create();
        $outletA = Outlet::factory()->forTenant($tenant)->create();
        $outletB = Outlet::factory()->forTenant($tenant)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outletA)->create();
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Owner)->create());

        foreach ([$outletA, $outletB] as $outlet) {
            $this->postJson('/api/v1/orders', [
                'outlet_id' => $outlet->id,
                'customer_id' => $customer->id,
                'items' => [['service_id' => $service->id, 'qty' => 1]],
                'payment_method' => 'cash',
                'paid_amount' => 10000,
            ])->assertCreated();
        }

        $this->getJson("/api/v1/dashboard/summary?outlet_id={$outletA->id}")
            ->assertOk()
            ->assertJsonPath('data.orders_today', 1)
            ->assertJsonPath('data.sales_today', 10000);
    }
}

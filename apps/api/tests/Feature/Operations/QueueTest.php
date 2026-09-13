<?php

namespace Tests\Feature\Operations;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifikasi_order_masuk_antrean(): void
    {
        Queue::fake();

        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        User::factory()->forTenant($tenant)->withRole(Role::Owner)->create();
        User::factory()->forTenant($tenant)->withRole(Role::Manager)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outlet)->create();
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create());

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->assertCreated();

        Queue::assertPushed(SendQueuedNotifications::class);
    }
}

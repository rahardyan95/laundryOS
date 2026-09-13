<?php

namespace Tests\Feature\Database;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Operations\Models\CashClosing;
use App\Domains\Operations\Models\CashEntry;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Ordering\Models\Order;
use App\Domains\Ordering\Models\OrderItem;
use App\Domains\Ordering\Models\OrderStatusHistory;
use App\Domains\Support\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FactoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_factory_model_inti_dapat_membuat_record(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outlet)->create();

        $order = Order::factory()->forOutlet($outlet)->create(['customer_id' => $customer->id]);
        $item = OrderItem::factory()->forOrder($order)->create();
        $history = OrderStatusHistory::factory()->forOrder($order)->create();
        $task = DeliveryTask::factory()->forOrder($order)->create();
        $cash = CashEntry::factory()->forOutlet($outlet)->create();
        $closing = CashClosing::factory()->forOutlet($outlet)->create();
        $log = ActivityLog::factory()->forTenant($tenant)->create();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'tenant_id' => $tenant->id]);
        $this->assertDatabaseHas('order_items', ['id' => $item->id, 'order_id' => $order->id]);
        $this->assertDatabaseHas('order_status_histories', ['id' => $history->id]);
        $this->assertDatabaseHas('delivery_tasks', ['id' => $task->id]);
        $this->assertDatabaseHas('cash_entries', ['id' => $cash->id]);
        $this->assertDatabaseHas('cash_closings', ['id' => $closing->id]);
        $this->assertDatabaseHas('activity_logs', ['id' => $log->id]);
    }

    public function test_order_factory_status_paid_mengisi_pembayaran(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();

        $order = Order::factory()->forOutlet($outlet)->paid()->create();

        $this->assertSame('paid', $order->payment_status->value);
        $this->assertSame($order->total, $order->paid_amount);
    }
}

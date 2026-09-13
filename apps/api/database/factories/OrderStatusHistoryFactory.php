<?php

namespace Database\Factories;

use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;
use App\Domains\Ordering\Models\OrderStatusHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderStatusHistory>
 */
class OrderStatusHistoryFactory extends Factory
{
    protected $model = OrderStatusHistory::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'from_status' => null,
            'to_status' => OrderStatus::Received,
            'changed_by_id' => null,
            'note' => null,
        ];
    }

    public function forOrder(Order $order): static
    {
        return $this->state(fn () => ['order_id' => $order->id]);
    }
}

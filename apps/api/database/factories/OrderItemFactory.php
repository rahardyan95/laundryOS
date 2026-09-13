<?php

namespace Database\Factories;

use App\Domains\Catalog\Enums\ServiceUnit;
use App\Domains\Ordering\Models\Order;
use App\Domains\Ordering\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $qty = fake()->randomFloat(2, 1, 6);
        $unitPrice = fake()->numberBetween(6_000, 30_000);

        return [
            'order_id' => Order::factory(),
            'service_id' => null,
            'service_name' => fake()->randomElement(['Cuci Kering', 'Cuci Setrika', 'Setrika Saja']),
            'unit' => ServiceUnit::Kg,
            'qty' => $qty,
            'unit_price' => $unitPrice,
            'subtotal' => (int) round($qty * $unitPrice),
            'note' => null,
        ];
    }

    public function forOrder(Order $order): static
    {
        return $this->state(fn () => ['order_id' => $order->id]);
    }
}

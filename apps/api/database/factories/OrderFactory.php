<?php

namespace Database\Factories;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Enums\PaymentMethod;
use App\Domains\Ordering\Enums\PaymentStatus;
use App\Domains\Ordering\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $total = fake()->numberBetween(10_000, 200_000);

        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => Outlet::factory(),
            'customer_id' => Customer::factory(),
            'ticket' => strtoupper(fake()->bothify('OUT-########-###')),
            'status' => OrderStatus::Received,
            'payment_status' => PaymentStatus::Unpaid,
            'payment_method' => null,
            'paid_amount' => 0,
            'total' => $total,
            'note' => null,
            'pickup_requested' => false,
            'delivery_requested' => false,
            'estimated_done_at' => now()->addDays(2),
            'completed_at' => null,
        ];
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(fn () => ['tenant_id' => $tenant->id]);
    }

    public function forOutlet(Outlet $outlet): static
    {
        return $this->state(fn () => [
            'tenant_id' => $outlet->tenant_id,
            'outlet_id' => $outlet->id,
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => PaymentStatus::Paid,
            'payment_method' => PaymentMethod::Cash,
            'paid_amount' => $attributes['total'],
        ]);
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}

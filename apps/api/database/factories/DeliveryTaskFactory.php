<?php

namespace Database\Factories;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Operations\Enums\DeliveryTaskStatus;
use App\Domains\Operations\Enums\DeliveryTaskType;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Ordering\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryTask>
 */
class DeliveryTaskFactory extends Factory
{
    protected $model = DeliveryTask::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => Outlet::factory(),
            'order_id' => Order::factory(),
            'driver_id' => null,
            'type' => DeliveryTaskType::Pickup,
            'scheduled_at' => now()->addHours(3),
            'address' => fake()->address(),
            'status' => DeliveryTaskStatus::Pending,
            'proof_path' => null,
            'notes' => null,
            'completed_at' => null,
        ];
    }

    public function forOrder(Order $order): static
    {
        return $this->state(fn () => [
            'tenant_id' => $order->tenant_id,
            'outlet_id' => $order->outlet_id,
            'order_id' => $order->id,
        ]);
    }
}

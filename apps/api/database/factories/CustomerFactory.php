<?php

namespace Database\Factories;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => null,
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
        ];
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => $tenant->id,
        ]);
    }

    public function forOutlet(?Outlet $outlet): static
    {
        return $this->state(fn (array $attributes) => [
            'outlet_id' => $outlet?->id,
        ]);
    }
}

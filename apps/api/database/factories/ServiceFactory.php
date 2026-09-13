<?php

namespace Database\Factories;

use App\Domains\Catalog\Enums\ServiceUnit;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => null,
            'name' => 'Layanan '.fake()->words(2, true),
            'unit' => ServiceUnit::Kg,
            'price_per_unit' => fake()->randomElement([6000, 7000, 11000, 16000]),
            'estimated_hours' => fake()->randomElement([6, 24, 48]),
            'active' => true,
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

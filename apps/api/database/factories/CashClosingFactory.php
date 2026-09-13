<?php

namespace Database\Factories;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Operations\Models\CashClosing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashClosing>
 */
class CashClosingFactory extends Factory
{
    protected $model = CashClosing::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => Outlet::factory(),
            'closed_by_id' => null,
            'date' => now()->toDateString(),
            'note' => null,
        ];
    }

    public function forOutlet(Outlet $outlet): static
    {
        return $this->state(fn () => [
            'tenant_id' => $outlet->tenant_id,
            'outlet_id' => $outlet->id,
        ]);
    }
}

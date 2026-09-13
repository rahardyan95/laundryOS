<?php

namespace Database\Factories;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Operations\Enums\CashEntryType;
use App\Domains\Operations\Models\CashEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashEntry>
 */
class CashEntryFactory extends Factory
{
    protected $model = CashEntry::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'outlet_id' => Outlet::factory(),
            'order_id' => null,
            'created_by_id' => null,
            'type' => CashEntryType::Income,
            'category' => 'Laundry',
            'amount' => fake()->numberBetween(10_000, 500_000),
            'payment_method' => null,
            'note' => null,
            'occurred_at' => now()->toDateString(),
        ];
    }

    public function forOutlet(Outlet $outlet): static
    {
        return $this->state(fn () => [
            'tenant_id' => $outlet->tenant_id,
            'outlet_id' => $outlet->id,
        ]);
    }

    public function expense(): static
    {
        return $this->state(fn () => ['type' => CashEntryType::Expense, 'category' => 'Deterjen']);
    }
}

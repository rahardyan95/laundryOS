<?php

namespace Database\Factories;

use App\Domains\Identity\Models\Tenant;
use App\Domains\Support\Models\ActivityLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    protected $model = ActivityLog::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'actor_id' => null,
            'action' => fake()->randomElement(['order.created', 'order.status', 'cash.closed']),
            'subject_type' => null,
            'subject_id' => null,
            'properties' => [],
        ];
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(fn () => ['tenant_id' => $tenant->id]);
    }
}

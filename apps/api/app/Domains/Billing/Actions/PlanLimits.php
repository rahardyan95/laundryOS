<?php

namespace App\Domains\Billing\Actions;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;

class PlanLimits
{
    public function limitsFor(Tenant $tenant): array
    {
        return config('plans.'.$tenant->plan->value, config('plans.starter'));
    }

    public function labelFor(Tenant $tenant): string
    {
        return $this->limitsFor($tenant)['label'] ?? $tenant->plan->value;
    }

    /** @return array{outlets: int, users: int, orders_this_month: int} */
    public function usage(Tenant $tenant): array
    {
        return [
            'outlets' => Outlet::query()->where('tenant_id', $tenant->id)->count(),
            'users' => User::query()->where('tenant_id', $tenant->id)->count(),
            'orders_this_month' => Order::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', '!=', OrderStatus::Cancelled->value)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];
    }

    public function checkOutlet(Tenant $tenant): void
    {
        $limits = $this->limitsFor($tenant);

        if ($this->usage($tenant)['outlets'] >= $limits['outlets']) {
            throw new PlanLimitExceededException("Batas outlet paket {$limits['label']} tercapai.");
        }
    }

    public function checkUser(Tenant $tenant): void
    {
        $limits = $this->limitsFor($tenant);

        if ($this->usage($tenant)['users'] >= $limits['users']) {
            throw new PlanLimitExceededException("Batas pengguna paket {$limits['label']} tercapai.");
        }
    }

    public function checkOrderVolume(Tenant $tenant): void
    {
        $limits = $this->limitsFor($tenant);

        if ($this->usage($tenant)['orders_this_month'] >= $limits['orders_per_month']) {
            throw new PlanLimitExceededException("Batas order bulanan paket {$limits['label']} tercapai.");
        }
    }
}

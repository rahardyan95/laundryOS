<?php

namespace App\Domains\Ordering\Policies;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier, Role::Operator], true);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }

    public function updateStatus(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Operator], true);
    }

    public function cancel(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }
}

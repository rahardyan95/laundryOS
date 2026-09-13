<?php

namespace App\Domains\Operations\Policies;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;

class CashPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }

    public function close(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager], true);
    }
}

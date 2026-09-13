<?php

namespace App\Domains\Catalog\Policies;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Cashier], true);
    }
}

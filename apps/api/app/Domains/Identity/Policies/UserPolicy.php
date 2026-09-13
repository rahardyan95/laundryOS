<?php

namespace App\Domains\Identity\Policies;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager], true);
    }

    public function create(User $user): bool
    {
        return $user->role === Role::Owner;
    }

    public function viewSubscription(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager], true);
    }

    public function manageSubscription(User $user): bool
    {
        return $user->role === Role::Owner;
    }
}

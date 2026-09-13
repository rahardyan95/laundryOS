<?php

namespace App\Domains\Operations\Policies;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;
use App\Domains\Operations\Models\DeliveryTask;

class DeliveryTaskPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager, Role::Driver], true);
    }

    public function view(User $user, DeliveryTask $task): bool
    {
        if (in_array($user->role, [Role::Owner, Role::Manager], true)) {
            return true;
        }

        return $user->role === Role::Driver && $task->driver_id === $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager], true);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, [Role::Owner, Role::Manager], true);
    }

    public function progress(User $user, DeliveryTask $task): bool
    {
        return $this->view($user, $task) && $user->role !== Role::Cashier;
    }
}

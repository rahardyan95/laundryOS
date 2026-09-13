<?php

namespace App\Domains\Support\Actions;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Notifications\OrderNotification;
use App\Domains\Support\Notifications\PickupTaskNotification;
use Illuminate\Support\Facades\Notification;

class NotifyStaff
{
    public function orderEvent(Order $order, string $event): void
    {
        $staff = User::query()
            ->where('tenant_id', $order->tenant_id)
            ->whereIn('role', [Role::Owner->value, Role::Manager->value])
            ->get();

        Notification::send($staff, new OrderNotification($order->loadMissing('customer'), $event));
    }

    public function taskAssigned(DeliveryTask $task): void
    {
        $task->loadMissing(['driver', 'order']);

        if ($task->driver) {
            Notification::send($task->driver, new PickupTaskNotification($task));
        }
    }
}

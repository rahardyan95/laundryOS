<?php

namespace App\Domains\Support\Actions;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\DeviceToken;
use App\Domains\Identity\Models\User;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Notifications\OrderNotification;
use App\Domains\Support\Notifications\PickupTaskNotification;
use App\Domains\Support\Push\PushNotifier;
use Illuminate\Support\Facades\Notification;

class NotifyStaff
{
    public function __construct(private readonly PushNotifier $push) {}

    public function orderEvent(Order $order, string $event): void
    {
        $staff = User::query()
            ->where('tenant_id', $order->tenant_id)
            ->whereIn('role', [Role::Owner->value, Role::Manager->value])
            ->get();

        Notification::send($staff, new OrderNotification($order->loadMissing('customer'), $event));

        $tokens = DeviceToken::query()->whereIn('user_id', $staff->pluck('id'))->pluck('token');
        $this->push->send(
            $tokens,
            "Order {$order->ticket}",
            $order->customer?->name ?? 'Order diperbarui',
            ['order_id' => $order->id, 'event' => $event],
        );
    }

    public function taskAssigned(DeliveryTask $task): void
    {
        $task->loadMissing(['driver', 'order']);

        if ($task->driver) {
            Notification::send($task->driver, new PickupTaskNotification($task));

            $tokens = DeviceToken::query()->where('user_id', $task->driver->id)->pluck('token');
            $this->push->send(
                $tokens,
                'Tugas antar-jemput baru',
                $task->order?->ticket ?? 'Tugas baru',
                ['task_id' => $task->id],
            );
        }
    }
}

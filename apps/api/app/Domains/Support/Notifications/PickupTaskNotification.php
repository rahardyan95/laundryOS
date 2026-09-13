<?php

namespace App\Domains\Support\Notifications;

use App\Domains\Operations\Models\DeliveryTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PickupTaskNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public DeliveryTask $task) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function isUrgent(): bool
    {
        return $this->task->scheduled_at->isBefore(now()->addDay());
    }

    public function toDatabase(object $notifiable): array
    {
        $kind = $this->task->type->value === 'pickup' ? 'Pickup' : 'Delivery';
        $when = $this->task->scheduled_at->format('d M H:i');

        return [
            'title' => "Tugas {$kind} baru",
            'body' => "Order {$this->task->order->ticket} · jadwal {$when}".($this->isUrgent() ? ' · kurang dari 24 jam' : ''),
            'task_id' => $this->task->id,
            'order_id' => $this->task->order_id,
            'scheduled_at' => $this->task->scheduled_at->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->toDatabase($notifiable);

        return (new MailMessage)
            ->subject("[LaundryOS] {$data['title']}")
            ->line($data['title'])
            ->line($data['body']);
    }
}

<?php

namespace App\Domains\Support\Notifications;

use App\Domains\Ordering\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $event
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toDatabase(object $notifiable): array
    {
        $titles = [
            'created' => "Order baru {$this->order->ticket}",
            'ready' => "Cucian siap diambil ({$this->order->ticket})",
            'completed' => "Order selesai ({$this->order->ticket})",
        ];

        return [
            'title' => $titles[$this->event] ?? "Update order {$this->order->ticket}",
            'body' => "{$this->order->customer->name} · Rp".number_format($this->order->total, 0, ',', '.'),
            'order_id' => $this->order->id,
            'ticket' => $this->order->ticket,
            'event' => $this->event,
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

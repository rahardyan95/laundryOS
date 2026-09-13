<?php

namespace App\Domains\Ordering\Actions;

use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Actions\RecordActivity;
use Illuminate\Support\Facades\DB;

class CancelOrder
{
    public function __construct(private RecordActivity $activity) {}

    public function handle(Order $order, User $actor, ?string $note = null): Order
    {
        if ($order->status !== OrderStatus::Received) {
            throw new InvalidOrderTransitionException($order, 'hanya dapat dibatalkan sebelum diproses');
        }

        return DB::transaction(function () use ($order, $actor, $note): Order {
            $order->status = OrderStatus::Cancelled;
            $order->save();
            $order->history()->create([
                'from_status' => OrderStatus::Received,
                'to_status' => OrderStatus::Cancelled,
                'changed_by_id' => $actor->id,
                'note' => $note,
            ]);
            $this->activity->handle($actor, 'order.cancelled', $order);

            return $order->load(['items', 'customer', 'history.changedBy']);
        });
    }
}

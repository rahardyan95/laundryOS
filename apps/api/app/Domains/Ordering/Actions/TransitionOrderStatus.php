<?php

namespace App\Domains\Ordering\Actions;

use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Actions\NotifyStaff;
use App\Domains\Support\Actions\RecordActivity;
use Illuminate\Support\Facades\DB;

class TransitionOrderStatus
{
    public function __construct(
        private RecordActivity $activity,
        private NotifyStaff $notifier,
    ) {}

    public function advance(Order $order, User $actor, ?string $note = null): Order
    {
        $next = $order->status->next();

        if ($next === null) {
            throw new InvalidOrderTransitionException($order, 'order sudah pada status akhir');
        }

        return DB::transaction(function () use ($order, $actor, $next, $note): Order {
            $from = $order->status;
            $order->status = $next;

            if ($next === OrderStatus::Completed) {
                $order->completed_at = now();
            }

            $order->save();
            $order->history()->create([
                'from_status' => $from,
                'to_status' => $next,
                'changed_by_id' => $actor->id,
                'note' => $note,
            ]);
            $this->activity->handle($actor, 'order.status_changed', $order, [
                'from' => $from->value,
                'to' => $next->value,
            ]);

            if (in_array($next, [OrderStatus::Ready, OrderStatus::Completed], true)) {
                $this->notifier->orderEvent($order, $next->value);
            }

            return $order->load(['items', 'customer', 'history.changedBy']);
        });
    }
}

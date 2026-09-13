<?php

namespace App\Domains\Ordering\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket' => $this->ticket,
            'outlet_id' => $this->outlet_id,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'service_id' => $item->service_id,
                'service_name' => $item->service_name,
                'unit' => $item->unit instanceof \BackedEnum ? $item->unit->value : $item->unit,
                'qty' => (float) $item->qty,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
                'note' => $item->note,
            ])->all()),
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn ($event) => [
                'from_status' => $event->from_status?->value,
                'status' => $event->to_status->value,
                'at' => $event->created_at?->toIso8601String(),
                'by_user' => $event->changedBy?->name,
                'note' => $event->note,
            ])->all()),
            'note' => $this->note,
            'pickup_requested' => $this->pickup_requested,
            'delivery_requested' => $this->delivery_requested,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'payment_method' => $this->payment_method?->value,
            'paid_amount' => $this->paid_amount,
            'total' => $this->total,
            'created_at' => $this->created_at?->toIso8601String(),
            'estimated_done_at' => $this->estimated_done_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}

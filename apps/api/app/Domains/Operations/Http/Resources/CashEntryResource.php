<?php

namespace App\Domains\Operations\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'outlet_id' => $this->outlet_id,
            'type' => $this->type->value,
            'category' => $this->category,
            'amount' => $this->amount,
            'balance_impact' => $this->balanceImpact(),
            'payment_method' => $this->payment_method?->value,
            'order_id' => $this->order_id,
            'note' => $this->note,
            'occurred_at' => $this->occurred_at?->toDateString(),
        ];
    }
}

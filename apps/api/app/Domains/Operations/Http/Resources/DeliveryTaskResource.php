<?php

namespace App\Domains\Operations\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class DeliveryTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $id = $this->id;

        return [
            'id' => $id,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'address' => $this->address,
            'notes' => $this->notes,
            'proof_url' => $this->proofUrl($id),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'order' => $this->whenLoaded('order', fn () => [
                'id' => $this->order->id,
                'ticket' => $this->order->ticket,
            ]),
            'driver' => $this->whenLoaded('driver', fn () => $this->driver ? [
                'id' => $this->driver->id,
                'name' => $this->driver->name,
            ] : null),
        ];
    }

    /**
     * URL bertanda tangan + kedaluwarsa ke endpoint penyaji bukti. Berkasnya
     * sendiri tersimpan di disk privat, jadi tautan inilah satu-satunya jalan
     * membacanya dan hanya berlaku 30 menit.
     */
    private function proofUrl(int|string $taskId): ?string
    {
        if (! $this->proof_path) {
            return null;
        }

        return URL::temporarySignedRoute('delivery-tasks.proof', now()->addMinutes(30), [
            'delivery_task' => $taskId,
        ]);
    }
}

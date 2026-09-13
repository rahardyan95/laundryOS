<?php

namespace App\Domains\Identity\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'tenant_id' => $this->tenant_id,
            'outlet_id' => $this->outlet_id,
            'outlet_name' => $this->whenLoaded('outlet', fn () => $this->outlet?->name),
        ];
    }
}

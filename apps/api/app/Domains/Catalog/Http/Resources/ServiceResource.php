<?php

namespace App\Domains\Catalog\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'unit' => $this->unit->value,
            'price_per_unit' => $this->price_per_unit,
            'estimated_hours' => $this->estimated_hours,
            'active' => $this->active,
        ];
    }
}

<?php

namespace App\Domains\Ordering\Models;

use App\Domains\Catalog\Enums\ServiceUnit;
use App\Domains\Catalog\Models\Service;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'service_id', 'service_name', 'unit', 'qty',
        'unit_price', 'subtotal', 'note',
    ];

    protected function casts(): array
    {
        return [
            'unit' => ServiceUnit::class,
            'qty' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}

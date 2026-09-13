<?php

namespace App\Domains\Ordering\Models;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Scopes\TenantScope;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Enums\PaymentMethod;
use App\Domains\Ordering\Enums\PaymentStatus;
use App\Domains\Ordering\Policies\OrderPolicy;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ScopedBy([TenantScope::class])]
#[UsePolicy(OrderPolicy::class)]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'customer_id', 'ticket', 'status',
        'payment_status', 'payment_method', 'paid_amount', 'total', 'note',
        'pickup_requested', 'delivery_requested', 'estimated_done_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'payment_method' => PaymentMethod::class,
            'pickup_requested' => 'boolean',
            'delivery_requested' => 'boolean',
            'estimated_done_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->orderBy('created_at');
    }

    protected static function newFactory(): OrderFactory
    {
        return OrderFactory::new();
    }
}

<?php

namespace App\Domains\Operations\Models;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Scopes\TenantScope;
use App\Domains\Operations\Enums\CashEntryType;
use App\Domains\Operations\Policies\CashPolicy;
use App\Domains\Ordering\Enums\PaymentMethod;
use App\Domains\Ordering\Models\Order;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy([TenantScope::class])]
#[UsePolicy(CashPolicy::class)]
class CashEntry extends Model
{
    protected $fillable = [
        'tenant_id', 'outlet_id', 'order_id', 'created_by_id', 'type',
        'category', 'amount', 'payment_method', 'note', 'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => CashEntryType::class,
            'payment_method' => PaymentMethod::class,
            'occurred_at' => 'date',
        ];
    }

    public function balanceImpact(): int
    {
        return $this->type === CashEntryType::Income ? $this->amount : -$this->amount;
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}

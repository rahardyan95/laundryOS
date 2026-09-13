<?php

namespace App\Domains\Operations\Models;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Scopes\TenantScope;
use App\Domains\Operations\Enums\DeliveryTaskStatus;
use App\Domains\Operations\Enums\DeliveryTaskType;
use App\Domains\Operations\Policies\DeliveryTaskPolicy;
use App\Domains\Ordering\Models\Order;
use Database\Factories\DeliveryTaskFactory;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy([TenantScope::class])]
#[UsePolicy(DeliveryTaskPolicy::class)]
class DeliveryTask extends Model
{
    /** @use HasFactory<DeliveryTaskFactory> */
    use HasFactory;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'order_id', 'driver_id', 'type',
        'scheduled_at', 'address', 'status', 'proof_path', 'notes', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => DeliveryTaskType::class,
            'status' => DeliveryTaskStatus::class,
            'scheduled_at' => 'datetime',
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

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    protected static function newFactory(): DeliveryTaskFactory
    {
        return DeliveryTaskFactory::new();
    }
}

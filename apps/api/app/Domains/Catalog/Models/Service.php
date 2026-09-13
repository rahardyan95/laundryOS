<?php

namespace App\Domains\Catalog\Models;

use App\Domains\Catalog\Enums\ServiceUnit;
use App\Domains\Catalog\Policies\ServicePolicy;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Scopes\TenantScope;
use Database\Factories\ServiceFactory;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy([TenantScope::class])]
#[UsePolicy(ServicePolicy::class)]
class Service extends Model
{
    /** @use HasFactory<ServiceFactory> */
    use HasFactory;

    protected $fillable = ['tenant_id', 'outlet_id', 'name', 'unit', 'price_per_unit', 'estimated_hours', 'active'];

    protected function casts(): array
    {
        return [
            'unit' => ServiceUnit::class,
            'active' => 'boolean',
        ];
    }

    protected static function newFactory(): ServiceFactory
    {
        return ServiceFactory::new();
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}

<?php

namespace App\Domains\Identity\Models;

use App\Domains\Identity\Scopes\TenantScope;
use Database\Factories\OutletFactory;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy([TenantScope::class])]
class Outlet extends Model
{
    /** @use HasFactory<OutletFactory> */
    use HasFactory;

    protected $fillable = ['tenant_id', 'code', 'name', 'address', 'phone'];

    protected static function newFactory(): OutletFactory
    {
        return OutletFactory::new();
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

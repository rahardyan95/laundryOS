<?php

namespace App\Domains\Operations\Models;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Scopes\TenantScope;
use Database\Factories\CashClosingFactory;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ScopedBy([TenantScope::class])]
class CashClosing extends Model
{
    /** @use HasFactory<CashClosingFactory> */
    use HasFactory;

    protected $fillable = ['tenant_id', 'outlet_id', 'closed_by_id', 'date', 'note'];

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_id');
    }

    protected static function newFactory(): CashClosingFactory
    {
        return CashClosingFactory::new();
    }
}

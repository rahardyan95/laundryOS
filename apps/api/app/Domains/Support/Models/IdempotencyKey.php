<?php

namespace App\Domains\Support\Models;

use App\Domains\Identity\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IdempotencyKey extends Model
{
    protected $fillable = ['user_id', 'key', 'response_code', 'response_body'];

    protected $hidden = ['response_body'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

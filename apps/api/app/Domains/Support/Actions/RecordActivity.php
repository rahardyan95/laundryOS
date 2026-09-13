<?php

namespace App\Domains\Support\Actions;

use App\Domains\Identity\Models\User;
use App\Domains\Support\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

class RecordActivity
{
    public function handle(User $actor, string $action, Model $subject, array $properties = []): ActivityLog
    {
        return ActivityLog::create([
            'tenant_id' => $actor->tenant_id,
            'actor_id' => $actor->id,
            'action' => $action,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'properties' => $properties === [] ? null : $properties,
        ]);
    }
}

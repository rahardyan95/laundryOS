<?php

namespace App\Domains\Operations\Enums;

enum DeliveryTaskStatus: string
{
    case Pending = 'pending';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Done = 'done';
    case Cancelled = 'cancelled';

    public function next(): ?self
    {
        return match ($this) {
            self::Pending => self::Assigned,
            self::Assigned => self::InProgress,
            self::InProgress => self::Done,
            default => null,
        };
    }

    public function cancellable(): bool
    {
        return in_array($this, [self::Pending, self::Assigned], true);
    }
}

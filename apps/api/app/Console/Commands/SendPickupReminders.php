<?php

namespace App\Console\Commands;

use App\Domains\Operations\Enums\DeliveryTaskStatus;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Support\Actions\NotifyStaff;
use Illuminate\Console\Command;

class SendPickupReminders extends Command
{
    protected $signature = 'pickup:remind';

    protected $description = 'Kirim pengingat pickup yang dijadwalkan dalam 24 jam ke depan';

    public function handle(NotifyStaff $notifier): int
    {
        $tasks = DeliveryTask::query()
            ->where('type', 'pickup')
            ->whereIn('status', [DeliveryTaskStatus::Assigned, DeliveryTaskStatus::Pending])
            ->whereNotNull('driver_id')
            ->whereNull('reminder_sent_at')
            ->where('scheduled_at', '<=', now()->addDay())
            ->where('scheduled_at', '>', now())
            ->with('driver')
            ->get();

        foreach ($tasks as $task) {
            $notifier->taskAssigned($task);
            $task->forceFill(['reminder_sent_at' => now()])->saveQuietly();
        }

        $this->info("Reminder terkirim untuk {$tasks->count()} task.");

        return self::SUCCESS;
    }
}

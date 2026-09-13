<?php

use App\Domains\Support\Models\IdempotencyKey;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('pickup:remind')->hourly();

Schedule::call(fn () => IdempotencyKey::where('created_at', '<', now()->subDay())->delete())
    ->hourly()
    ->name('idempotency:prune');

<?php

namespace App\Domains\Ordering\Support;

use App\Domains\Identity\Models\Outlet;
use Illuminate\Support\Facades\DB;

class TicketNumberGenerator
{
    public function forOutlet(Outlet $outlet): string
    {
        return DB::transaction(function () use ($outlet): string {
            $today = now()->toDateString();

            $counter = DB::table('ticket_counters')
                ->where('outlet_id', $outlet->id)
                ->where('date', $today)
                ->lockForUpdate()
                ->first();

            $seq = ($counter->seq ?? 0) + 1;

            DB::table('ticket_counters')->upsert(
                [[
                    'tenant_id' => $outlet->tenant_id,
                    'outlet_id' => $outlet->id,
                    'date' => $today,
                    'seq' => $seq,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]],
                ['outlet_id', 'date'],
                ['seq', 'updated_at']
            );

            return sprintf('%s-%s-%03d', $outlet->code, now()->format('Ymd'), $seq);
        });
    }
}

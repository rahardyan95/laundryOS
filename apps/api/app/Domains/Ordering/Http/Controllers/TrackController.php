<?php

namespace App\Domains\Ordering\Http\Controllers;

use App\Domains\Identity\Scopes\TenantScope;
use App\Domains\Ordering\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class TrackController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket' => ['required', 'string', 'max:30'],
            'phone' => ['required', 'string', 'max:30'],
        ], [
            'ticket.required' => 'Nomor ticket wajib diisi.',
            'phone.required' => 'Nomor telepon wajib diisi.',
        ]);

        $phone = self::digits($data['phone']);

        // Nomor tanpa digit (mis. "---") tidak boleh cocok dengan pelanggan mana pun,
        // termasuk yang nomornya kosong di data.
        if (strlen($phone) < 8) {
            abort(404);
        }

        // Lookup publik tanpa auth: tenant tidak diketahui dari user,
        // sehingga global scope dilepas dan otorisasi diganti pasangan ticket+telepon.
        // Relasi customer ikut dilepas karena TenantScope fail-closed untuk guest.
        // Nomor ticket hanya unik per tenant (kode outlet bisa sama antar tenant),
        // jadi semua kandidat diperiksa dan hanya diterima bila tepat satu cocok.
        $candidates = Order::withoutGlobalScope(TenantScope::class)
            ->with([
                'items',
                'customer' => fn ($query) => $query->withoutGlobalScope(TenantScope::class),
                'history',
            ])
            ->where('ticket', $data['ticket'])
            ->limit(5)
            ->get();

        $matches = $candidates->filter(
            fn (Order $order): bool => hash_equals(self::digits($order->customer->phone), $phone)
        );

        if ($matches->count() !== 1) {
            abort(404);
        }

        $order = $matches->first();

        return response()->json(['data' => [
            'ticket' => $order->ticket,
            'status' => $order->status->value,
            'customer_name' => $order->customer->name,
            'items' => $order->items->map(fn ($item) => [
                'service_name' => $item->service_name,
                'qty' => (float) $item->qty,
                'unit' => $item->unit->value,
            ])->all(),
            'total' => $order->total,
            'estimated_done_at' => $order->estimated_done_at?->toIso8601String(),
            'history' => $order->history->map(fn ($event) => [
                'status' => $event->to_status->value,
                'at' => $event->created_at?->toIso8601String(),
            ])->all(),
        ]]);
    }

    private static function digits(string $phone): string
    {
        return (string) preg_replace('/\D/', '', $phone);
    }
}

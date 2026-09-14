<?php

namespace App\Domains\Identity\Http\Middleware;

use App\Domains\Identity\Enums\TenantStatus;
use Closure;
use Illuminate\Http\Request;

class EnsureSubscriptionActive
{
    /**
     * Endpoint yang tetap terbuka saat langganan tidak aktif: auth (agar pengguna
     * bisa logout / tahu keadaannya) dan status langganan itu sendiri.
     *
     * @var list<string>
     */
    private const ALWAYS_ALLOWED = ['api/v1/auth/*', 'api/v1/subscription'];

    public function handle(Request $request, Closure $next): mixed
    {
        $status = $request->user()?->tenant->status;

        if ($status === null || in_array($status, [TenantStatus::Trial, TenantStatus::Active], true)) {
            return $next($request);
        }

        if ($request->is(...self::ALWAYS_ALLOWED)) {
            return $next($request);
        }

        // Baca ikut ditutup, bukan hanya tulis: tenant yang menunggak tidak boleh
        // terus mengekspor data lewat GET.
        return response()->json([
            'message' => 'Langganan tidak aktif. Hubungi admin untuk perpanjangan.',
            'code' => 'subscription_inactive',
        ], 403);
    }
}

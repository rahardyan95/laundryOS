<?php

namespace App\Domains\Identity\Http\Middleware;

use App\Domains\Identity\Enums\TenantStatus;
use Closure;
use Illuminate\Http\Request;

class EnsureSubscriptionActive
{
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->is('api/v1/auth/*')) {
            return $next($request);
        }

        if (in_array($request->method(), ['POST', 'PATCH', 'PUT', 'DELETE'], true)) {
            $status = $request->user()?->tenant->status;

            if ($status && ! in_array($status, [TenantStatus::Trial, TenantStatus::Active], true)) {
                return response()->json([
                    'message' => 'Langganan tidak aktif. Hubungi admin untuk perpanjangan.',
                ], 403);
            }
        }

        return $next($request);
    }
}

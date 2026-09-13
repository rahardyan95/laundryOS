<?php

namespace App\Domains\Support\Http\Middleware;

use App\Domains\Support\Models\IdempotencyKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memastikan mutasi dengan header `Idempotency-Key` hanya dijalankan sekali.
 * Request berulang dengan key sama mengembalikan respons tersimpan.
 */
class EnsureIdempotency
{
    private const METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');

        if ($key === null || $key === '' || ! in_array($request->method(), self::METHODS, true)) {
            return $next($request);
        }

        $userId = $request->user()?->id;

        $record = IdempotencyKey::query()
            ->where('user_id', $userId)
            ->where('key', $key)
            ->first();

        if ($record !== null) {
            return response($record->response_body ?? '', $record->response_code ?? 200, [
                'Content-Type' => 'application/json',
                'Idempotency-Replayed' => 'true',
            ]);
        }

        $response = $next($request);

        if ($response->getStatusCode() < 500) {
            IdempotencyKey::create([
                'user_id' => $userId,
                'key' => $key,
                'response_code' => $response->getStatusCode(),
                'response_body' => $response->getContent(),
            ]);
        }

        return $response;
    }
}

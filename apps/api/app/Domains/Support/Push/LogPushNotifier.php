<?php

namespace App\Domains\Support\Push;

use Illuminate\Support\Facades\Log;

/**
 * Implementasi default: push hanya dicatat. Ganti binding ke provider FCM
 * (butuh service account) di produksi via AppServiceProvider.
 */
class LogPushNotifier implements PushNotifier
{
    public function send(iterable $tokens, string $title, string $body, array $data = []): void
    {
        $list = is_array($tokens) ? $tokens : iterator_to_array($tokens);

        if ($list === []) {
            return;
        }

        Log::info('push.dispatch', [
            'count' => count($list),
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }
}

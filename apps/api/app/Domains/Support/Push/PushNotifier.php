<?php

namespace App\Domains\Support\Push;

interface PushNotifier
{
    /**
     * @param  iterable<string>  $tokens
     * @param  array<string, mixed>  $data
     */
    public function send(iterable $tokens, string $title, string $body, array $data = []): void;
}

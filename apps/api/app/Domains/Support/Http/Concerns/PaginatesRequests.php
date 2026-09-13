<?php

namespace App\Domains\Support\Http\Concerns;

use Illuminate\Http\Request;

trait PaginatesRequests
{
    protected function perPage(Request $request, int $default = 15, int $max = 100): int
    {
        return min(max($request->integer('per_page', $default), 1), $max);
    }
}

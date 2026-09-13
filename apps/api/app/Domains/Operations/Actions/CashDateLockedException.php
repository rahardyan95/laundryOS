<?php

namespace App\Domains\Operations\Actions;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class CashDateLockedException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Kas tanggal tersebut sudah ditutup.');
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}

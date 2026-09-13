<?php

namespace App\Domains\Ordering\Actions;

use App\Domains\Ordering\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InvalidOrderTransitionException extends RuntimeException
{
    public function __construct(public Order $order, string $detail)
    {
        parent::__construct("Transisi status tidak sah untuk order {$order->ticket}: {$detail}.");
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}

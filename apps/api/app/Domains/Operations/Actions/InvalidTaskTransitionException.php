<?php

namespace App\Domains\Operations\Actions;

use App\Domains\Operations\Models\DeliveryTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InvalidTaskTransitionException extends RuntimeException
{
    public function __construct(public DeliveryTask $task, string $detail)
    {
        parent::__construct("Transisi task {$task->id} tidak sah: {$detail}.");
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}

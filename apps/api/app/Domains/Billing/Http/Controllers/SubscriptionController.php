<?php

namespace App\Domains\Billing\Http\Controllers;

use App\Domains\Billing\Actions\PlanLimits;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SubscriptionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PlanLimits $plans) {}

    /**
     * Paket hanya bisa dibaca di sini. Perubahan paket adalah jalur operator
     * (`php artisan tenant:plan`) supaya tenant tidak bisa menaikkan paketnya
     * sendiri tanpa pembayaran.
     */
    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewSubscription', User::class);

        return response()->json(['data' => $this->payload($request->user()->tenant)]);
    }

    private function payload($tenant): array
    {
        return [
            'plan' => $tenant->plan->value,
            'plan_label' => $this->plans->labelFor($tenant),
            'status' => $tenant->status->value,
            'limits' => $this->plans->limitsFor($tenant),
            'usage' => $this->plans->usage($tenant),
        ];
    }
}

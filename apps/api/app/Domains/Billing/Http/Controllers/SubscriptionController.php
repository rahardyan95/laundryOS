<?php

namespace App\Domains\Billing\Http\Controllers;

use App\Domains\Billing\Actions\PlanLimits;
use App\Domains\Identity\Enums\PlanTier;
use App\Domains\Identity\Models\User;
use App\Domains\Support\Actions\RecordActivity;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PlanLimits $plans) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewSubscription', User::class);

        return response()->json(['data' => $this->payload($request->user()->tenant)]);
    }

    public function update(Request $request, RecordActivity $activity): JsonResponse
    {
        $this->authorize('manageSubscription', User::class);

        $data = $request->validate([
            'plan' => ['required', Rule::enum(PlanTier::class)],
        ]);

        $tenant = $request->user()->tenant;
        $from = $tenant->plan->value;
        $tenant->plan = PlanTier::from($data['plan']);
        $tenant->save();
        $activity->handle($request->user(), 'subscription.plan_changed', $tenant, [
            'from' => $from,
            'to' => $tenant->plan->value,
        ]);

        return response()->json(['data' => $this->payload($tenant->refresh())]);
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

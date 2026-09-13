<?php

namespace App\Domains\Identity\Http\Controllers;

use App\Domains\Billing\Actions\PlanLimits;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Http\Requests\StoreUserRequest;
use App\Domains\Identity\Http\Resources\UserResource;
use App\Domains\Identity\Models\User;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $request->validate(['role' => ['nullable', Rule::enum(Role::class)]]);

        $query = User::query()
            ->where('tenant_id', $request->user()->tenant_id)
            ->orderBy('name');

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        return UserResource::collection($query->paginate($this->perPage($request)));
    }

    public function store(StoreUserRequest $request, PlanLimits $plans): JsonResponse
    {
        $this->authorize('create', User::class);

        $plans->checkUser($request->user()->tenant);

        $user = User::create([
            ...$request->validated(),
            'tenant_id' => $request->user()->tenant_id,
        ]);

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}

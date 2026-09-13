<?php

namespace App\Domains\Identity\Http\Controllers;

use App\Domains\Billing\Actions\PlanLimits;
use App\Domains\Identity\Http\Requests\StoreOutletRequest;
use App\Domains\Identity\Http\Resources\OutletResource;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class OutletController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Outlet::class);

        return OutletResource::collection(Outlet::query()->orderBy('name')->paginate($this->perPage($request)));
    }

    public function show(Outlet $outlet): OutletResource
    {
        $this->authorize('viewAny', Outlet::class);

        return new OutletResource($outlet);
    }

    public function store(StoreOutletRequest $request, PlanLimits $plans): JsonResponse
    {
        $this->authorize('create', Outlet::class);

        $plans->checkOutlet($request->user()->tenant);

        $outlet = Outlet::create([
            ...$request->validated(),
            'tenant_id' => $request->user()->tenant_id,
        ]);

        return (new OutletResource($outlet))->response()->setStatusCode(201);
    }
}

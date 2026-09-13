<?php

namespace App\Domains\Catalog\Http\Controllers;

use App\Domains\Catalog\Http\Requests\StoreServiceRequest;
use App\Domains\Catalog\Http\Requests\UpdateServiceRequest;
use App\Domains\Catalog\Http\Resources\ServiceResource;
use App\Domains\Catalog\Models\Service;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class ServiceController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Service::class);

        $query = Service::query()->orderBy('name');

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where('name', 'ilike', "%{$q}%");
        }

        return ServiceResource::collection($query->paginate($this->perPage($request)));
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $this->authorize('create', Service::class);

        $service = Service::create([
            ...$request->validated(),
            'tenant_id' => $request->user()->tenant_id,
        ]);

        return (new ServiceResource($service))->response()->setStatusCode(201);
    }

    public function show(Service $service): ServiceResource
    {
        $this->authorize('view', $service);

        return new ServiceResource($service);
    }

    public function update(UpdateServiceRequest $request, Service $service): ServiceResource
    {
        $this->authorize('update', $service);

        $service->update($request->validated());

        return new ServiceResource($service);
    }
}

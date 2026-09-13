<?php

namespace App\Domains\Operations\Http\Controllers;

use App\Domains\Identity\Enums\Role;
use App\Domains\Operations\Actions\InvalidTaskTransitionException;
use App\Domains\Operations\Enums\DeliveryTaskStatus;
use App\Domains\Operations\Http\Requests\StoreDeliveryTaskRequest;
use App\Domains\Operations\Http\Requests\UpdateDeliveryTaskRequest;
use App\Domains\Operations\Http\Resources\DeliveryTaskResource;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Actions\NotifyStaff;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class DeliveryTaskController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', DeliveryTask::class);

        $query = DeliveryTask::query()->with(['order', 'driver'])->orderBy('scheduled_at');

        if ($request->user()->role === Role::Driver) {
            $query->where('driver_id', $request->user()->id);
        }

        return DeliveryTaskResource::collection($query->paginate($this->perPage($request)));
    }

    public function store(StoreDeliveryTaskRequest $request, NotifyStaff $notifier): JsonResponse
    {
        $this->authorize('create', DeliveryTask::class);

        $order = Order::findOrFail($request->validated('order_id'));

        $task = DeliveryTask::create([
            ...$request->validated(),
            'tenant_id' => $request->user()->tenant_id,
            'outlet_id' => $order->outlet_id,
            'status' => $request->validated('driver_id')
                ? DeliveryTaskStatus::Assigned
                : DeliveryTaskStatus::Pending,
        ]);
        $notifier->taskAssigned($task);

        return (new DeliveryTaskResource($task->load(['order', 'driver'])))->response()->setStatusCode(201);
    }

    public function show(DeliveryTask $deliveryTask): DeliveryTaskResource
    {
        $this->authorize('view', $deliveryTask);

        return new DeliveryTaskResource($deliveryTask->load(['order', 'driver']));
    }

    public function update(UpdateDeliveryTaskRequest $request, DeliveryTask $deliveryTask): DeliveryTaskResource
    {
        $this->authorize('update', $deliveryTask);

        $deliveryTask->update($request->validated());

        return new DeliveryTaskResource($deliveryTask->load(['order', 'driver']));
    }

    public function status(Request $request, DeliveryTask $deliveryTask): DeliveryTaskResource
    {
        $this->authorize('progress', $deliveryTask);

        $target = DeliveryTaskStatus::tryFrom((string) $request->input('status'));

        if ($target === null || $target !== $deliveryTask->status->next()) {
            throw new InvalidTaskTransitionException($deliveryTask, 'task hanya dapat maju satu tahap');
        }

        $deliveryTask->status = $target;

        if ($target === DeliveryTaskStatus::Done) {
            $deliveryTask->completed_at = now();
        }

        $deliveryTask->save();

        return new DeliveryTaskResource($deliveryTask->load(['order', 'driver']));
    }

    public function proof(Request $request, DeliveryTask $deliveryTask): DeliveryTaskResource
    {
        $this->authorize('progress', $deliveryTask);

        $request->validate([
            'proof' => ['required', 'image', 'max:2048'],
        ], [
            'proof.required' => 'Foto bukti wajib diunggah.',
            'proof.image' => 'Berkas harus berupa gambar.',
            'proof.max' => 'Ukuran foto maksimal 2MB.',
        ]);

        $deliveryTask->proof_path = $request->file('proof')->store('proofs', config('filesystems.proof_disk'));
        $deliveryTask->save();

        return new DeliveryTaskResource($deliveryTask->load(['order', 'driver']));
    }
}

<?php

namespace App\Domains\Ordering\Http\Controllers;

use App\Domains\Ordering\Actions\CancelOrder;
use App\Domains\Ordering\Actions\CreateOrder;
use App\Domains\Ordering\Actions\TransitionOrderStatus;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Http\Requests\StoreOrderRequest;
use App\Domains\Ordering\Http\Resources\OrderResource;
use App\Domains\Ordering\Models\Order;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Order::class);

        $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'outlet_id' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $query = Order::query()->with(['items', 'customer'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', $request->query('outlet_id'));
        }

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(fn ($w) => $w
                ->where('ticket', 'ilike', "%{$q}%")
                ->orWhereHas('customer', fn ($c) => $c->where('name', 'ilike', "%{$q}%")));
        }

        return OrderResource::collection($query->paginate($this->perPage($request)));
    }

    public function store(StoreOrderRequest $request, CreateOrder $action): JsonResponse
    {
        $this->authorize('create', Order::class);

        $order = $action->handle($request->user(), $request->validated());

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        $this->authorize('view', $order);

        return new OrderResource($order->load(['items', 'customer', 'history.changedBy']));
    }

    public function status(Request $request, Order $order, TransitionOrderStatus $action): OrderResource
    {
        $this->authorize('updateStatus', $order);

        $note = $request->input('note');

        return new OrderResource($action->advance($order, $request->user(), is_string($note) ? $note : null));
    }

    public function cancel(Request $request, Order $order, CancelOrder $action): OrderResource
    {
        $this->authorize('cancel', $order);

        $note = $request->input('note');

        return new OrderResource($action->handle($order, $request->user(), is_string($note) ? $note : null));
    }
}

<?php

namespace App\Domains\Support\Http\Controllers;

use App\Domains\Identity\Enums\Role;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        abort_unless(in_array($user->role, [Role::Owner, Role::Manager], true), 403);

        $request->validate(['outlet_id' => ['nullable', 'integer']]);

        $base = Order::query()->where('status', '!=', OrderStatus::Cancelled);

        if ($request->filled('outlet_id')) {
            $base->where('outlet_id', $request->query('outlet_id'));
        }

        $today = (clone $base)->whereDate('created_at', today());

        $workload = (clone $base)
            ->selectRaw('status, COUNT(*) as count')
            ->whereNotIn('status', [OrderStatus::Completed->value, OrderStatus::Cancelled->value])
            ->groupBy('status')
            ->pluck('count', 'status');

        $readyWaiting = (clone $base)
            ->with(['customer', 'history'])
            ->where('status', OrderStatus::Ready)
            ->get()
            ->map(function (Order $order): ?array {
                $readyAt = $order->history->where('to_status', OrderStatus::Ready)->last()?->created_at;

                if ($readyAt === null) {
                    return null;
                }

                $hours = (int) $readyAt->diffInHours(now());

                return $hours >= 12 ? [
                    'ticket' => $order->ticket,
                    'customer_name' => $order->customer->name,
                    'hours_waiting' => $hours,
                ] : null;
            })
            ->filter()
            ->values();

        return response()->json(['data' => [
            'orders_today' => (clone $today)->count(),
            'sales_today' => (int) (clone $today)->sum('total'),
            'outstanding' => (int) (clone $base)->sum(DB::raw('total - paid_amount')),
            'cash_balance' => (int) (clone $base)->sum('paid_amount'),
            'workload' => collect(OrderStatus::cases())
                ->reject(fn (OrderStatus $s) => in_array($s, [OrderStatus::Completed, OrderStatus::Cancelled], true))
                ->map(fn (OrderStatus $s) => ['status' => $s->value, 'count' => (int) ($workload[$s->value] ?? 0)])
                ->values(),
            'ready_waiting' => $readyWaiting,
        ]]);
    }
}

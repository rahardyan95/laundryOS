<?php

namespace App\Domains\Support\Http\Controllers;

use App\Domains\Identity\Enums\Role;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Models\Order;
use App\Domains\Ordering\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, [Role::Owner, Role::Manager], true), 403);

        [$from, $to, $outletId] = $this->filters($request);

        $base = $this->scopedOrders($user->tenant_id, $from, $to, $outletId);

        $revenueByDay = (clone $base)
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $topServices = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.tenant_id', $user->tenant_id)
            ->where('orders.status', '!=', OrderStatus::Cancelled->value)
            ->whereDate('orders.created_at', '>=', $from)
            ->whereDate('orders.created_at', '<=', $to)
            ->when($outletId, fn ($q) => $q->where('orders.outlet_id', $outletId))
            ->groupBy('order_items.service_name')
            ->selectRaw('order_items.service_name as name, SUM(order_items.qty) as qty, SUM(order_items.subtotal) as revenue')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return response()->json(['data' => [
            'from' => $from,
            'to' => $to,
            'revenue_total' => (int) (clone $base)->sum('total'),
            'orders_total' => (clone $base)->count(),
            'revenue_by_day' => $revenueByDay,
            'orders_by_status' => collect(OrderStatus::cases())->map(fn (OrderStatus $s) => [
                'status' => $s->value,
                'count' => (int) ($byStatus[$s->value] ?? 0),
            ])->values(),
            'top_services' => $topServices,
        ]]);
    }

    public function salesCsv(Request $request): StreamedResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, [Role::Owner, Role::Manager], true), 403);

        [$from, $to, $outletId] = $this->filters($request);

        $orders = $this->scopedOrders($user->tenant_id, $from, $to, $outletId)
            ->with(['customer', 'items'])
            ->orderBy('created_at')
            ->get();

        $filename = "penjualan-{$from}_{$to}.csv";

        return response()->streamDownload(function () use ($orders): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ticket', 'tanggal', 'pelanggan', 'isi', 'total', 'dibayar', 'status', 'pembayaran']);
            foreach ($orders as $order) {
                fputcsv($out, [
                    $order->ticket,
                    $order->created_at?->format('Y-m-d H:i'),
                    $order->customer->name,
                    $order->items->map(fn ($i) => "{$i->service_name} {$i->qty}{$i->unit->value}")->join(' | '),
                    $order->total,
                    $order->paid_amount,
                    $order->status->value,
                    $order->payment_status->value,
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** @return array{string, string, ?int} */
    private function filters(Request $request): array
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
            'outlet_id' => ['sometimes', 'integer'],
        ]);

        return [
            $data['from'] ?? today()->subDays(30)->toDateString(),
            $data['to'] ?? today()->toDateString(),
            isset($data['outlet_id']) ? (int) $data['outlet_id'] : null,
        ];
    }

    private function scopedOrders(int $tenantId, string $from, string $to, ?int $outletId)
    {
        return Order::query()
            ->where('tenant_id', $tenantId)
            ->where('status', '!=', OrderStatus::Cancelled->value)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->when($outletId, fn ($q) => $q->where('outlet_id', $outletId));
    }
}

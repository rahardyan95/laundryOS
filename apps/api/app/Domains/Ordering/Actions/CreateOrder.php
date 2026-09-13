<?php

namespace App\Domains\Ordering\Actions;

use App\Domains\Billing\Actions\PlanLimits;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Enums\OrderStatus;
use App\Domains\Ordering\Enums\PaymentStatus;
use App\Domains\Ordering\Models\Order;
use App\Domains\Ordering\Support\TicketNumberGenerator;
use App\Domains\Support\Actions\NotifyStaff;
use App\Domains\Support\Actions\RecordActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrder
{
    public function __construct(
        private TicketNumberGenerator $tickets,
        private RecordActivity $activity,
        private NotifyStaff $notifier,
        private PlanLimits $plans,
    ) {}

    public function handle(User $actor, array $input): Order
    {
        $this->plans->checkOrderVolume($actor->tenant);

        return DB::transaction(function () use ($actor, $input): Order {
            $outlet = Outlet::findOrFail($input['outlet_id']);
            $services = Service::whereIn('id', collect($input['items'])->pluck('service_id'))
                ->get()->keyBy('id');

            $rows = [];
            $total = 0;
            $maxHours = 0;

            foreach ($input['items'] as $entry) {
                $service = $services->get($entry['service_id']);

                if (! $service || ! $service->active) {
                    throw ValidationException::withMessages([
                        'items' => ['Layanan tidak tersedia.'],
                    ]);
                }

                $qty = (float) $entry['qty'];
                $subtotal = (int) round($qty * $service->price_per_unit);
                $total += $subtotal;
                $maxHours = max($maxHours, $service->estimated_hours);

                $rows[] = [
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'unit' => $service->unit->value,
                    'qty' => $qty,
                    'unit_price' => $service->price_per_unit,
                    'subtotal' => $subtotal,
                    'note' => $entry['note'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            $paid = (int) ($input['paid_amount'] ?? 0);

            if ($paid > $total) {
                throw ValidationException::withMessages([
                    'paid_amount' => ['Nominal dibayar tidak boleh melebihi total order.'],
                ]);
            }

            $order = Order::create([
                'tenant_id' => $actor->tenant_id,
                'outlet_id' => $outlet->id,
                'customer_id' => $input['customer_id'],
                'ticket' => $this->tickets->forOutlet($outlet),
                'status' => OrderStatus::Received,
                'payment_status' => $total > 0 && $paid >= $total
                    ? PaymentStatus::Paid
                    : ($paid > 0 ? PaymentStatus::Partial : PaymentStatus::Unpaid),
                'payment_method' => $paid > 0 ? $input['payment_method'] ?? null : null,
                'paid_amount' => $paid,
                'total' => $total,
                'note' => $input['note'] ?? null,
                'pickup_requested' => (bool) ($input['pickup_requested'] ?? false),
                'delivery_requested' => (bool) ($input['delivery_requested'] ?? false),
                'estimated_done_at' => now()->addHours($maxHours),
            ]);

            $order->items()->createMany($rows);
            $order->history()->create([
                'from_status' => null,
                'to_status' => OrderStatus::Received,
                'changed_by_id' => $actor->id,
            ]);
            $this->activity->handle($actor, 'order.created', $order, ['ticket' => $order->ticket, 'total' => $total]);
            $this->notifier->orderEvent($order, 'created');

            return $order->load(['items', 'customer', 'history.changedBy']);
        });
    }
}

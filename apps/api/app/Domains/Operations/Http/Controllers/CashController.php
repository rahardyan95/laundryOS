<?php

namespace App\Domains\Operations\Http\Controllers;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Operations\Actions\CashDateLockedException;
use App\Domains\Operations\Enums\CashEntryType;
use App\Domains\Operations\Http\Requests\StoreCashEntryRequest;
use App\Domains\Operations\Http\Resources\CashEntryResource;
use App\Domains\Operations\Models\CashClosing;
use App\Domains\Operations\Models\CashEntry;
use App\Domains\Support\Actions\RecordActivity;
use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;

class CashController extends Controller
{
    use AuthorizesRequests, PaginatesRequests;

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', CashEntry::class);

        $query = CashEntry::query()->orderByDesc('occurred_at')->orderByDesc('id');

        if ($request->filled('outlet_id')) {
            $query->where('outlet_id', $request->query('outlet_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('occurred_at', $request->query('date'));
        }

        return CashEntryResource::collection($query->paginate($this->perPage($request)));
    }

    public function store(StoreCashEntryRequest $request): JsonResponse
    {
        $this->authorize('create', CashEntry::class);

        $date = $request->date('occurred_at') ?? today();
        $this->assertOpen((int) $request->validated('outlet_id'), $date->toDateString());

        $entry = CashEntry::create([
            ...$request->validated(),
            'tenant_id' => $request->user()->tenant_id,
            'created_by_id' => $request->user()->id,
            'occurred_at' => $date->toDateString(),
        ]);

        return (new CashEntryResource($entry))->response()->setStatusCode(201);
    }

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CashEntry::class);

        $request->validate([
            'outlet_id' => ['required', 'integer'],
            'date' => ['sometimes', 'date'],
        ]);

        $date = $request->date('date')?->toDateString() ?? today()->toDateString();
        $entries = CashEntry::query()
            ->where('outlet_id', $request->query('outlet_id'))
            ->whereDate('occurred_at', $date)
            ->get();

        $income = $entries->where('type', CashEntryType::Income)->sum('amount');
        $expense = $entries->where('type', CashEntryType::Expense)->sum('amount');

        return response()->json(['data' => [
            'date' => $date,
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
            'closed' => $this->isClosed((int) $request->query('outlet_id'), $date),
        ]]);
    }

    public function close(Request $request, RecordActivity $activity): JsonResponse
    {
        $this->authorize('close', CashEntry::class);

        $data = $request->validate([
            'outlet_id' => ['required', 'integer'],
            'date' => ['required', 'date'],
        ]);

        $outlet = Outlet::findOrFail($data['outlet_id']);
        $date = $request->date('date')->toDateString();

        if ($this->isClosed($outlet->id, $date)) {
            throw new CashDateLockedException;
        }

        $closing = CashClosing::create([
            'tenant_id' => $request->user()->tenant_id,
            'outlet_id' => $outlet->id,
            'closed_by_id' => $request->user()->id,
            'date' => $date,
        ]);
        $activity->handle($request->user(), 'cash.closed', $closing, ['date' => $date]);

        return response()->json(['message' => "Kas tanggal {$date} ditutup."], 201);
    }

    public function reopen(Request $request, RecordActivity $activity): JsonResponse
    {
        $this->authorize('close', CashEntry::class);

        $data = $request->validate([
            'outlet_id' => ['required', 'integer'],
            'date' => ['required', 'date'],
        ]);

        $closing = CashClosing::query()
            ->where('outlet_id', $data['outlet_id'])
            ->whereDate('date', $data['date'])
            ->firstOrFail();
        $activity->handle($request->user(), 'cash.reopened', $closing, ['date' => $data['date']]);
        $closing->delete();

        return response()->json(['message' => "Kas tanggal {$data['date']} dibuka kembali."]);
    }

    private function assertOpen(int $outletId, string $date): void
    {
        if ($this->isClosed($outletId, $date)) {
            throw new CashDateLockedException;
        }
    }

    private function isClosed(int $outletId, string $date): bool
    {
        return CashClosing::query()
            ->where('outlet_id', $outletId)
            ->whereDate('date', $date)
            ->exists();
    }
}

<?php

namespace App\Domains\Support\Http\Controllers;

use App\Domains\Support\Http\Concerns\PaginatesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationController extends Controller
{
    use PaginatesRequests;

    public function index(Request $request): JsonResponse
    {
        $paginator = $request->user()->notifications()->latest()->paginate($this->perPage($request));
        $paginator->setCollection($paginator->getCollection()->map(fn ($n) => [
            'id' => $n->id,
            'type' => class_basename($n->type),
            'title' => $n->data['title'] ?? null,
            'body' => $n->data['body'] ?? null,
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ]));

        return response()->json($paginator);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'unread' => $request->user()->unreadNotifications()->count(),
        ]]);
    }

    public function read(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notifikasi ditandai sudah dibaca.']);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}

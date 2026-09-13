<?php

namespace App\Domains\Identity\Http\Controllers;

use App\Domains\Identity\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class DeviceTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['required', Rule::in(['android', 'ios'])],
        ]);

        DeviceToken::updateOrCreate(
            ['token' => $validated['token']],
            ['user_id' => $request->user()->id, 'platform' => $validated['platform']],
        );

        return response()->json(['message' => 'Token perangkat terdaftar.']);
    }

    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate(['token' => ['required', 'string']]);

        DeviceToken::where('user_id', $request->user()->id)
            ->where('token', $validated['token'])
            ->delete();

        return response()->json(['message' => 'Token perangkat dihapus.']);
    }
}

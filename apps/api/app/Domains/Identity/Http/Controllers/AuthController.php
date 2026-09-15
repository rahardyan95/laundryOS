<?php

namespace App\Domains\Identity\Http\Controllers;

use App\Domains\Identity\Http\Requests\LoginRequest;
use App\Domains\Identity\Http\Resources\OutletResource;
use App\Domains\Identity\Http\Resources\TenantResource;
use App\Domains\Identity\Http\Resources\UserResource;
use App\Domains\Identity\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi salah.'],
            ]);
        }

        if (EnsureFrontendRequestsAreStateful::fromFrontend($request)) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return response()->json([
                'user' => new UserResource($user),
            ]);
        }

        $token = $user->createToken($request->validated('device_name') ?? 'api', [$user->role->value])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Sesi SPA (cookie) memakai TransientToken yang tidak punya baris di
        // personal_access_tokens — hanya token API persisten yang dicabut.
        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => new UserResource($user),
            'tenant' => new TenantResource($user->tenant),
            'outlets' => OutletResource::collection($user->tenant->outlets),
        ]);
    }
}

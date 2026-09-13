<?php

namespace App\Domains\Identity\Http\Controllers;

use App\Domains\Identity\Http\Requests\LoginRequest;
use App\Domains\Identity\Http\Resources\OutletResource;
use App\Domains\Identity\Http\Resources\TenantResource;
use App\Domains\Identity\Http\Resources\UserResource;
use App\Domains\Identity\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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

        $token = $user->createToken($request->validated('device_name'), [$user->role->value])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => new UserResource($user),
        ]);
    }

    public function logout(): JsonResponse
    {
        request()->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(): JsonResponse
    {
        $user = request()->user();

        return response()->json([
            'user' => new UserResource($user),
            'tenant' => new TenantResource($user->tenant),
            'outlets' => OutletResource::collection($user->tenant->outlets),
        ]);
    }
}

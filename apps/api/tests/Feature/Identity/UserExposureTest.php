<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserExposureTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_tidak_mengembalikan_hash_password(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'password',
            'device_name' => 'web',
        ])
            ->assertOk()
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.remember_token');
    }

    public function test_me_tidak_mengembalikan_hash_password(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.remember_token');
    }

    public function test_route_user_bawaan_sanctum_tidak_mengembalikan_hash_password(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();

        Sanctum::actingAs($user);

        // Route stok Sanctum mengembalikan model mentah, jadi satu-satunya
        // penjaga adalah daftar kolom tersembunyi di model User.
        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $user->email)
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('remember_token');
    }
}

<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_dengan_kredensial_valid_mengembalikan_token(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create([
            'email' => 'owner@laundryos.test',
            'password' => 'rahasia123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'rahasia123',
            'device_name' => 'web',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_login_dari_spa_memakai_sesi_tanpa_token(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create([
            'email' => 'owner@laundryos.test',
            'password' => 'rahasia123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'rahasia123',
        ], ['Origin' => 'http://localhost:3000']);

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonMissingPath('token');

        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_dengan_password_salah_ditolak(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create([
            'email' => 'owner@laundryos.test',
            'password' => 'rahasia123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'salah',
            'device_name' => 'web',
        ]);

        $response->assertStatus(422);
    }

    public function test_me_tanpa_token_unauthorized(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_me_mengembalikan_user_tenant_dan_outlets(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        $user = User::factory()->forTenant($tenant)->forOutlet($outlet)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('tenant.id', $tenant->id)
            ->assertJsonCount(1, 'outlets');
    }

    public function test_logout_mencabut_token_aktif(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_guest_tanpa_header_json_tetap_401(): void
    {
        $this->get('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_login_dibatasi_rate_limit(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'owner@laundryos.test',
                'password' => 'salah',
                'device_name' => 'web',
            ])->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'salah',
            'device_name' => 'web',
        ])->assertStatus(429);
    }

    public function test_login_tidak_bisa_melewati_rate_limit_dengan_header_x_forwarded_for(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        // Tanpa TRUSTED_PROXIES, header kiriman klien tidak boleh mengubah
        // identitas pemanggil — kalau berubah, setiap percobaan dapat jatah baru.
        for ($i = 0; $i < 10; $i++) {
            $this->withHeader('X-Forwarded-For', "203.0.113.{$i}")
                ->postJson('/api/v1/auth/login', [
                    'email' => 'owner@laundryos.test',
                    'password' => 'salah',
                    'device_name' => 'web',
                ])->assertStatus(422);
        }

        $this->withHeader('X-Forwarded-For', '203.0.113.99')
            ->postJson('/api/v1/auth/login', [
                'email' => 'owner@laundryos.test',
                'password' => 'salah',
                'device_name' => 'web',
            ])->assertStatus(429);
    }
}

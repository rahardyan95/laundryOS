<?php

namespace Tests\Feature\Security;

use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class TrustedProxyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Simulasi rantai produksi: request datang dari nginx di 172.28.0.5
        // yang dipercaya, klien asli di X-Forwarded-For.
        Request::setTrustedProxies(
            ['172.28.0.0/16'],
            Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST |
            Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO
        );
    }

    protected function tearDown(): void
    {
        Request::setTrustedProxies([], Request::HEADER_X_FORWARDED_FOR);
        parent::tearDown();
    }

    public function test_login_menolak_xff_palsu_dari_proxy_terpercaya(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        // Tiap percobaan memalsukan X-Forwarded-For berbeda, tapi REMOTE_ADDR
        // tetap proxy terpercaya — rate limit harus tetap menghitung satu identitas.
        for ($i = 0; $i < 10; $i++) {
            $this->call('POST', '/api/v1/auth/login', [
                'email' => 'owner@laundryos.test',
                'password' => 'salah',
                'device_name' => 'web',
            ], [], [], [
                'REMOTE_ADDR' => '172.28.0.5',
                'HTTP_X_FORWARDED_FOR' => "203.0.113.{$i}",
                'CONTENT_TYPE' => 'application/json',
                'HTTP_ACCEPT' => 'application/json',
            ])->assertStatus(422);
        }

        $this->call('POST', '/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'salah',
            'device_name' => 'web',
        ], [], [], [
            'REMOTE_ADDR' => '172.28.0.5',
            'HTTP_X_FORWARDED_FOR' => '203.0.113.99',
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ])->assertStatus(429);
    }
}

<?php

namespace Tests\Feature\Identity;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_akun_demo_seeder_dapat_login_semua_role(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach ([
            'owner@laundryos.test',
            'manager@laundryos.test',
            'kasir@laundryos.test',
            'operator@laundryos.test',
            'kurir@laundryos.test',
            'kasir.tbt@laundryos.test',
        ] as $email) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'password',
                'device_name' => 'regression',
            ]);

            $response->assertOk()->assertJsonPath('user.email', $email);
        }
    }

    public function test_password_demo_salah_ditolak_dengan_pesan_generik(): void
    {
        $this->seed(DatabaseSeeder::class);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@laundryos.test',
            'password' => 'bukan-password-demo',
            'device_name' => 'regression',
        ]);

        $response->assertStatus(422)->assertJsonPath('errors.email.0', 'Email atau kata sandi salah.');
    }
}

<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_mengirim_notifikasi_untuk_email_terdaftar(): void
    {
        Notification::fake();
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'owner@laundryos.test'])
            ->assertOk()
            ->assertJsonPath('message', 'Jika email terdaftar, tautan reset telah dikirim.');

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_email_tidak_terdaftar_tetap_200(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'tidak@ada.test'])
            ->assertOk();

        Notification::assertNothingSent();
    }

    public function test_reset_dengan_token_valid_mengubah_password(): void
    {
        $tenant = Tenant::factory()->create();
        $user = User::factory()->forTenant($tenant)->create([
            'email' => 'owner@laundryos.test',
            'password' => 'lama12345',
        ]);

        $token = Password::broker()->createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'owner@laundryos.test',
            'password' => 'baru12345',
            'password_confirmation' => 'baru12345',
        ])->assertOk()->assertJsonPath('message', 'Kata sandi berhasil diubah.');

        $this->assertTrue(Hash::check('baru12345', $user->fresh()->password));
    }

    public function test_reset_dengan_token_salah_ditolak(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->create(['email' => 'owner@laundryos.test']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'token-palsu',
            'email' => 'owner@laundryos.test',
            'password' => 'baru12345',
            'password_confirmation' => 'baru12345',
        ])->assertStatus(422);
    }
}

<?php

namespace Tests\Feature\Billing;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create(['plan' => 'starter', 'status' => 'trial']);
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $this->owner = User::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->withRole(Role::Owner)->create();
    }

    public function test_usage_menampilkan_pakai_dari_limit(): void
    {
        Sanctum::actingAs($this->owner);

        $this->getJson('/api/v1/subscription')
            ->assertOk()
            ->assertJsonPath('data.plan', 'starter')
            ->assertJsonPath('data.limits.outlets', 1)
            ->assertJsonPath('data.usage.outlets', 1)
            ->assertJsonPath('data.usage.users', 1)
            ->assertJsonStructure(['data' => ['plan', 'plan_label', 'status', 'limits', 'usage']]);
    }

    public function test_owner_tidak_bisa_ganti_paket_sendiri(): void
    {
        Sanctum::actingAs($this->owner);

        // Perubahan paket jalur operator; endpoint self-service dihapus.
        $this->patchJson('/api/v1/subscription', ['plan' => 'growth'])->assertStatus(405);

        $this->assertSame('starter', $this->tenant->refresh()->plan->value);
    }

    public function test_command_tenant_plan_mengubah_paket_dan_tercatat(): void
    {
        $this->artisan('tenant:plan', ['tenant' => (string) $this->tenant->id, 'plan' => 'growth'])
            ->assertExitCode(0);

        $this->assertSame('growth', $this->tenant->refresh()->plan->value);
        $this->assertDatabaseHas('activity_logs', [
            'tenant_id' => $this->tenant->id,
            'actor_id' => $this->owner->id,
            'action' => 'subscription.plan_changed',
        ]);
    }

    public function test_command_tenant_plan_menerima_email_owner(): void
    {
        $this->artisan('tenant:plan', ['tenant' => $this->owner->email, 'plan' => 'multi_outlet'])
            ->assertExitCode(0);

        $this->assertSame('multi_outlet', $this->tenant->refresh()->plan->value);
    }

    public function test_command_tenant_plan_menolak_tenant_atau_paket_tidak_dikenal(): void
    {
        $this->artisan('tenant:plan', ['tenant' => '999', 'plan' => 'growth'])->assertExitCode(1);
        $this->artisan('tenant:plan', ['tenant' => (string) $this->tenant->id, 'plan' => 'enterprise'])
            ->assertExitCode(1);

        $this->assertSame('starter', $this->tenant->refresh()->plan->value);
    }

    public function test_outlet_melebihi_limit_ditolak(): void
    {
        Sanctum::actingAs($this->owner);

        $this->postJson('/api/v1/outlets', [
            'code' => 'BRU',
            'name' => 'Cabang Baru',
        ])->assertStatus(422)->assertJsonPath('message', 'Batas outlet paket Starter tercapai.');
    }

    public function test_outlet_baru_dalam_limit_berhasil(): void
    {
        $this->tenant->update(['plan' => 'growth']);
        Sanctum::actingAs($this->owner);

        $this->postJson('/api/v1/outlets', ['code' => 'BRU', 'name' => 'Cabang Baru'])
            ->assertCreated()
            ->assertJsonPath('data.code', 'BRU');
    }

    public function test_invite_melebihi_limit_user_ditolak(): void
    {
        Sanctum::actingAs($this->owner);
        $payload = fn (string $email) => [
            'name' => 'Staff Baru',
            'email' => $email,
            'password' => 'rahasia123',
            'role' => 'cashier',
            'outlet_id' => $this->outlet->id,
        ];

        $this->postJson('/api/v1/users', $payload('satu@laundryos.test'))->assertCreated();
        $this->postJson('/api/v1/users', $payload('dua@laundryos.test'))->assertCreated();
        $this->postJson('/api/v1/users', $payload('tiga@laundryos.test'))
            ->assertStatus(422)
            ->assertJsonPath('message', 'Batas pengguna paket Starter tercapai.');
    }

    public function test_email_duplikat_ditolak(): void
    {
        $this->tenant->update(['plan' => 'growth']);
        Sanctum::actingAs($this->owner);

        $this->postJson('/api/v1/users', [
            'name' => 'Ganda',
            'email' => $this->owner->email,
            'password' => 'rahasia123',
            'role' => 'cashier',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_kasir_tidak_boleh_invite(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $this->postJson('/api/v1/users', [
            'name' => 'X',
            'email' => 'x@laundryos.test',
            'password' => 'rahasia123',
            'role' => 'cashier',
        ])->assertForbidden();
    }

    public function test_volume_order_bulanan_ditegakkan(): void
    {
        config()->set('plans.starter.orders_per_month', 0);
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create();

        $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 0,
        ])->assertStatus(422)->assertJsonPath('message', 'Batas order bulanan paket Starter tercapai.');
    }

    public function test_status_past_due_memblokir_baca_dan_tulis(): void
    {
        $this->tenant->update(['status' => 'past_due']);
        $cashier = User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create();
        Sanctum::actingAs($cashier);

        // Semua data bisnis ditutup, bukan hanya mutasi.
        $this->getJson('/api/v1/orders')
            ->assertForbidden()
            ->assertJsonPath('code', 'subscription_inactive');
        $this->getJson('/api/v1/reports/sales.csv')->assertForbidden();
        $this->postJson('/api/v1/orders', [])->assertForbidden();
    }

    public function test_status_past_due_tetap_boleh_logout_dan_lihat_langganan(): void
    {
        $this->tenant->update(['status' => 'past_due']);
        Sanctum::actingAs($this->owner);

        // Pemilik harus bisa melihat status langganannya, dan siapa pun bisa keluar.
        $this->getJson('/api/v1/subscription')
            ->assertOk()
            ->assertJsonPath('data.status', 'past_due');
        $this->getJson('/api/v1/auth/me')->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertOk();
    }
}

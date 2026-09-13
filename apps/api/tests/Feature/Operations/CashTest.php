<?php

namespace Tests\Feature\Operations;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CashTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
    }

    private function actor(Role $role): User
    {
        return User::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->withRole($role)->create();
    }

    private function entry(array $overrides = []): array
    {
        return array_merge([
            'outlet_id' => $this->outlet->id,
            'type' => 'income',
            'category' => 'Laundry',
            'amount' => 50000,
            'payment_method' => 'cash',
            'occurred_at' => now()->toDateString(),
        ], $overrides);
    }

    public function test_catat_pemasukan_dan_pengeluaran(): void
    {
        Sanctum::actingAs($this->actor(Role::Cashier));

        $this->postJson('/api/v1/cash-entries', $this->entry())
            ->assertCreated()->assertJsonPath('data.balance_impact', 50000);

        $this->postJson('/api/v1/cash-entries', $this->entry([
            'type' => 'expense', 'category' => 'Deterjen', 'amount' => 15000,
        ]))->assertCreated()->assertJsonPath('data.balance_impact', -15000);
    }

    public function test_operator_tidak_boleh_mencatat_kas(): void
    {
        Sanctum::actingAs($this->actor(Role::Operator));

        $this->postJson('/api/v1/cash-entries', $this->entry())->assertForbidden();
        $this->getJson('/api/v1/cash-entries')->assertForbidden();
    }

    public function test_ringkasan_harian_benar(): void
    {
        Sanctum::actingAs($this->actor(Role::Owner));

        $this->postJson('/api/v1/cash-entries', $this->entry(['amount' => 100000]))->assertCreated();
        $this->postJson('/api/v1/cash-entries', $this->entry(['type' => 'expense', 'amount' => 25000]))->assertCreated();

        $this->getJson("/api/v1/cash-entries/summary?outlet_id={$this->outlet->id}")
            ->assertOk()
            ->assertJsonPath('data.income', 100000)
            ->assertJsonPath('data.expense', 25000)
            ->assertJsonPath('data.balance', 75000)
            ->assertJsonPath('data.closed', false);
    }

    public function test_tutup_kas_mengunci_tanggal_qa04(): void
    {
        Sanctum::actingAs($this->actor(Role::Owner));
        $today = now()->toDateString();

        $this->postJson('/api/v1/cash-entries/close', [
            'outlet_id' => $this->outlet->id,
            'date' => $today,
        ])->assertCreated();

        Sanctum::actingAs($this->actor(Role::Cashier));
        $this->postJson('/api/v1/cash-entries', $this->entry())
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kas tanggal tersebut sudah ditutup.');

        Sanctum::actingAs($this->actor(Role::Owner));
        $this->getJson("/api/v1/cash-entries/summary?outlet_id={$this->outlet->id}")
            ->assertOk()->assertJsonPath('data.closed', true);
    }

    public function test_buka_kembali_hanya_owner_manajer(): void
    {
        Sanctum::actingAs($this->actor(Role::Owner));
        $today = now()->toDateString();
        $this->postJson('/api/v1/cash-entries/close', [
            'outlet_id' => $this->outlet->id,
            'date' => $today,
        ])->assertCreated();

        Sanctum::actingAs($this->actor(Role::Cashier));
        $this->postJson('/api/v1/cash-entries/reopen', [
            'outlet_id' => $this->outlet->id,
            'date' => $today,
        ])->assertForbidden();

        Sanctum::actingAs($this->actor(Role::Manager));
        $this->postJson('/api/v1/cash-entries/reopen', [
            'outlet_id' => $this->outlet->id,
            'date' => $today,
        ])->assertOk();

        Sanctum::actingAs($this->actor(Role::Cashier));
        $this->postJson('/api/v1/cash-entries', $this->entry())->assertCreated();
    }

    public function test_kas_tenant_lain_tidak_terlihat(): void
    {
        Sanctum::actingAs($this->actor(Role::Owner));
        $this->postJson('/api/v1/cash-entries', $this->entry())->assertCreated();

        $tenantB = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenantB)->withRole(Role::Owner)->create());

        $this->getJson('/api/v1/cash-entries')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_nominal_nol_ditolak(): void
    {
        Sanctum::actingAs($this->actor(Role::Cashier));

        $this->postJson('/api/v1/cash-entries', $this->entry(['amount' => 0]))
            ->assertStatus(422);
    }
}

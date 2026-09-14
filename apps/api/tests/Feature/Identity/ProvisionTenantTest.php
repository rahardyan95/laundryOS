<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Scopes\TenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProvisionTenantTest extends TestCase
{
    use RefreshDatabase;

    private function provision(array $overrides = []): array
    {
        return array_merge([
            '--name' => 'Laundry Contoh',
            '--outlet' => 'Kemang',
            '--email' => 'owner@contoh.test',
            '--password' => 'rahasia123',
            '--plan' => 'starter',
        ], $overrides);
    }

    public function test_provision_membuat_tenant_outlet_dan_owner(): void
    {
        $this->artisan('tenant:provision', $this->provision())->assertExitCode(0);

        $tenant = Tenant::sole();
        $this->assertSame('Laundry Contoh', $tenant->name);
        $this->assertSame('starter', $tenant->plan->value);
        $this->assertSame('active', $tenant->status->value);

        $outlet = Outlet::withoutGlobalScope(TenantScope::class)->sole();
        $this->assertSame($tenant->id, $outlet->tenant_id);
        $this->assertSame('KEM', $outlet->code);

        $owner = User::sole();
        $this->assertSame(Role::Owner, $owner->role);
        $this->assertSame($tenant->id, $owner->tenant_id);
        $this->assertSame($outlet->id, $owner->outlet_id);
        $this->assertTrue(Hash::check('rahasia123', $owner->password));
    }

    public function test_provision_email_sudah_ada_gagal_tanpa_menambah_baris(): void
    {
        $this->artisan('tenant:provision', $this->provision())->assertExitCode(0);

        $this->artisan('tenant:provision', $this->provision(['--name' => 'Laundry Lain']))
            ->assertExitCode(1);

        $this->assertDatabaseCount('tenants', 1);
        $this->assertDatabaseCount('outlets', 1);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_provision_menolak_opsi_kosong(): void
    {
        $this->artisan('tenant:provision', ['--name' => 'Laundry Contoh'])->assertExitCode(1);

        $this->assertDatabaseCount('tenants', 0);
    }

    public function test_provision_menolak_paket_tidak_dikenal(): void
    {
        $this->artisan('tenant:provision', $this->provision(['--plan' => 'enterprise']))
            ->assertExitCode(1);

        $this->assertDatabaseCount('tenants', 0);
    }

    public function test_provision_menolak_kata_sandi_pendek(): void
    {
        $this->artisan('tenant:provision', $this->provision(['--password' => 'pendek']))
            ->assertExitCode(1);

        $this->assertDatabaseCount('tenants', 0);
    }
}

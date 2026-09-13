<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OutletIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_outlet_hanya_menampilkan_milik_tenant_sendiri(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        Outlet::factory()->forTenant($tenantA)->create(['name' => 'Outlet A']);
        Outlet::factory()->forTenant($tenantB)->create(['name' => 'Outlet B']);
        $user = User::factory()->forTenant($tenantA)->withRole(Role::Owner)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/outlets')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Outlet A');
    }

    public function test_detail_outlet_tenant_lain_mengembalikan_404(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $foreign = Outlet::factory()->forTenant($tenantB)->create();
        $user = User::factory()->forTenant($tenantA)->withRole(Role::Owner)->create();

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/outlets/{$foreign->id}")->assertNotFound();
    }

    public function test_kasir_tidak_boleh_melihat_daftar_outlet(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create());

        $this->getJson('/api/v1/outlets')->assertForbidden();
    }
}

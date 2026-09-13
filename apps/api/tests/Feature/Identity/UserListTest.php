<?php

namespace Tests\Feature\Identity;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserListTest extends TestCase
{
    use RefreshDatabase;

    public function test_manajer_melihat_pengguna_tenant_sendiri(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole(Role::Driver)->create(['name' => 'Kurir Andi']);
        User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create();
        $otherTenant = Tenant::factory()->create();
        User::factory()->forTenant($otherTenant)->withRole(Role::Driver)->create();

        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Manager)->create());

        $this->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role']]]);
    }

    public function test_filter_peran_kurir(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->forTenant($tenant)->withRole(Role::Driver)->create();
        User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create();
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Owner)->create());

        $this->getJson('/api/v1/users?role=driver')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', 'driver');
    }

    public function test_kasir_tidak_boleh_melihat_pengguna(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenant)->withRole(Role::Cashier)->create());

        $this->getJson('/api/v1/users')->assertForbidden();
    }
}

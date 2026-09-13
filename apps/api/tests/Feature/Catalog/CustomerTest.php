<?php

namespace Tests\Feature\Catalog;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    private function userIn(Tenant $tenant, Role $role = Role::Owner): User
    {
        $outlet = Outlet::factory()->forTenant($tenant)->create();

        return User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole($role)->create();
    }

    public function test_create_pelanggan_valid_mengembalikan_201(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userIn($tenant, Role::Cashier));

        $response = $this->postJson('/api/v1/customers', [
            'outlet_id' => $outlet->id,
            'name' => 'Dewi Lestari',
            'phone' => '081233456712',
            'address' => 'Jl. Bangka IX No. 4',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Dewi Lestari')
            ->assertJsonStructure(['data' => ['id', 'name', 'phone', 'address']]);
    }

    public function test_create_tanpa_nama_ditolak_422(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userIn($tenant));

        $this->postJson('/api/v1/customers', [
            'outlet_id' => $outlet->id,
            'phone' => '081233456712',
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_operator_tidak_boleh_membuat_pelanggan(): void
    {
        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userIn($tenant, Role::Operator));

        $this->postJson('/api/v1/customers', [
            'outlet_id' => $outlet->id,
            'name' => 'X',
            'phone' => '0812',
        ])->assertForbidden();
    }

    public function test_detail_pelanggan_tenant_lain_404(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $foreign = Customer::factory()->forTenant($tenantB)->create();
        Sanctum::actingAs($this->userIn($tenantA));

        $this->getJson("/api/v1/customers/{$foreign->id}")->assertNotFound();
    }

    public function test_list_mendukung_pagination_dan_pencarian(): void
    {
        $tenant = Tenant::factory()->create();
        Customer::factory()->forTenant($tenant)->create(['name' => 'Dewi Lestari']);
        Customer::factory()->forTenant($tenant)->create(['name' => 'Agus Prasetyo']);
        Sanctum::actingAs($this->userIn($tenant));

        $this->getJson('/api/v1/customers?q=dewi')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);
    }

    public function test_update_pelanggan(): void
    {
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userIn($tenant));

        $this->patchJson("/api/v1/customers/{$customer->id}", [
            'name' => 'Nama Baru',
            'phone' => $customer->phone,
        ])->assertOk()->assertJsonPath('data.name', 'Nama Baru');
    }

    public function test_operator_tidak_boleh_update_pelanggan(): void
    {
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userIn($tenant, Role::Operator));

        $this->patchJson("/api/v1/customers/{$customer->id}", [
            'name' => 'X',
        ])->assertForbidden();
    }
}

<?php

namespace Tests\Feature\Catalog;

use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(Tenant $tenant, Role $role): User
    {
        return User::factory()->forTenant($tenant)->withRole($role)->create();
    }

    public function test_create_layanan_valid_mengembalikan_201(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs($this->userWithRole($tenant, Role::Manager));

        $response = $this->postJson('/api/v1/services', [
            'name' => 'Cuci Setrika',
            'unit' => 'kg',
            'price_per_unit' => 11000,
            'estimated_hours' => 48,
        ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Cuci Setrika');
    }

    public function test_create_dengan_unit_tidak_valid_ditolak(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs($this->userWithRole($tenant, Role::Manager));

        $this->postJson('/api/v1/services', [
            'name' => 'X',
            'unit' => 'lusin',
            'price_per_unit' => 1000,
            'estimated_hours' => 24,
        ])->assertStatus(422)->assertJsonValidationErrors(['unit']);
    }

    public function test_kasir_tidak_boleh_membuat_layanan(): void
    {
        $tenant = Tenant::factory()->create();
        Sanctum::actingAs($this->userWithRole($tenant, Role::Cashier));

        $this->postJson('/api/v1/services', [
            'name' => 'X',
            'unit' => 'kg',
            'price_per_unit' => 1000,
            'estimated_hours' => 24,
        ])->assertForbidden();
    }

    public function test_detail_layanan_tenant_lain_404(): void
    {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();
        $foreign = Service::factory()->forTenant($tenantB)->create();
        Sanctum::actingAs($this->userWithRole($tenantA, Role::Manager));

        $this->getJson("/api/v1/services/{$foreign->id}")->assertNotFound();
    }

    public function test_update_harga_layanan(): void
    {
        $tenant = Tenant::factory()->create();
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        Sanctum::actingAs($this->userWithRole($tenant, Role::Manager));

        $this->patchJson("/api/v1/services/{$service->id}", [
            'price_per_unit' => 12000,
        ])->assertOk()->assertJsonPath('data.price_per_unit', 12000);
    }

    public function test_kasir_boleh_melihat_katalog(): void
    {
        $tenant = Tenant::factory()->create();
        Service::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userWithRole($tenant, Role::Cashier));

        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);
    }

    public function test_kasir_tidak_boleh_update_layanan(): void
    {
        $tenant = Tenant::factory()->create();
        $service = Service::factory()->forTenant($tenant)->create();
        Sanctum::actingAs($this->userWithRole($tenant, Role::Cashier));

        $this->patchJson("/api/v1/services/{$service->id}", [
            'price_per_unit' => 999,
        ])->assertForbidden();
    }
}

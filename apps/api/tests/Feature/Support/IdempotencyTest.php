<?php

namespace Tests\Feature\Support;

use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $this->owner = User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create();
    }

    public function test_mutasi_dengan_key_sama_hanya_dijalankan_sekali(): void
    {
        Sanctum::actingAs($this->owner);
        $payload = ['outlet_id' => $this->outlet->id, 'name' => 'Budi', 'phone' => '0812-0000'];

        $first = $this->postJson('/api/v1/customers', $payload, ['Idempotency-Key' => 'key-abc'])
            ->assertCreated();

        $second = $this->postJson('/api/v1/customers', $payload, ['Idempotency-Key' => 'key-abc'])
            ->assertCreated();

        $second->assertHeader('Idempotency-Replayed', 'true');
        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertDatabaseCount('customers', 1);
    }

    public function test_tanpa_key_mutasi_dijalankan_berulang(): void
    {
        Sanctum::actingAs($this->owner);
        $payload = ['outlet_id' => $this->outlet->id, 'name' => 'Budi', 'phone' => '0812-1111'];

        $this->postJson('/api/v1/customers', $payload)->assertCreated();
        $this->postJson('/api/v1/customers', $payload)->assertCreated();

        $this->assertDatabaseCount('customers', 2);
    }

    public function test_key_dibatasi_per_pengguna(): void
    {
        Sanctum::actingAs($this->owner);
        $payload = ['outlet_id' => $this->outlet->id, 'name' => 'Budi', 'phone' => '0812-2222'];
        $this->postJson('/api/v1/customers', $payload, ['Idempotency-Key' => 'key-shared'])->assertCreated();

        $other = User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create();
        Sanctum::actingAs($other);
        $this->postJson('/api/v1/customers', $payload, ['Idempotency-Key' => 'key-shared'])->assertCreated();

        $this->assertDatabaseCount('customers', 2);
    }
}

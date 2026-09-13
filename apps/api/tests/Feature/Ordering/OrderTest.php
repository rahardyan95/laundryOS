<?php

namespace Tests\Feature\Ordering;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private Customer $customer;

    private Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create(['code' => 'KMG']);
        $this->customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $this->service = Service::factory()->forTenant($this->tenant)->create([
            'price_per_unit' => 11000,
        ]);
    }

    private function actor(Role $role = Role::Cashier): User
    {
        return User::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->withRole($role)->create();
    }

    private function orderPayload(array $overrides = []): array
    {
        return array_merge([
            'outlet_id' => $this->outlet->id,
            'customer_id' => $this->customer->id,
            'items' => [
                ['service_id' => $this->service->id, 'qty' => 2.5],
            ],
            'payment_method' => 'cash',
            'paid_amount' => 27500,
        ], $overrides);
    }

    private function createOrder(Role $role = Role::Cashier, array $overrides = []): Order
    {
        Sanctum::actingAs($this->actor($role));

        $response = $this->postJson('/api/v1/orders', $this->orderPayload($overrides));
        $response->assertCreated();

        return Order::findOrFail($response->json('data.id'));
    }

    public function test_create_order_valid_qa01(): void
    {
        Sanctum::actingAs($this->actor());

        $response = $this->postJson('/api/v1/orders', $this->orderPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', 'received')
            ->assertJsonPath('data.total', 27500)
            ->assertJsonPath('data.payment_status', 'paid')
            ->assertJsonStructure(['data' => ['id', 'ticket', 'items', 'history']]);

        $ticket = $response->json('data.ticket');
        $this->assertMatchesRegularExpression('/^KMG-\d{8}-\d{3}$/', $ticket);
        $this->assertCount(1, $response->json('data.history'));
    }

    public function test_ticket_unik_per_outlet(): void
    {
        $first = $this->createOrder();
        $second = $this->createOrder();

        $this->assertNotSame($first->ticket, $second->ticket);
    }

    public function test_advance_status_satu_tahap(): void
    {
        $order = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Operator));

        $this->postJson("/api/v1/orders/{$order->id}/status")
            ->assertOk()
            ->assertJsonPath('data.status', 'washing');

        $this->assertCount(2, Order::find($order->id)->history);
    }

    public function test_advance_dari_completed_ditolak_qa02(): void
    {
        $order = $this->createOrder();
        $operator = $this->actor(Role::Operator);
        Sanctum::actingAs($operator);

        foreach (['washing', 'drying', 'ironing', 'ready', 'completed'] as $expected) {
            $this->postJson("/api/v1/orders/{$order->id}/status")
                ->assertOk()
                ->assertJsonPath('data.status', $expected);
        }

        $this->postJson("/api/v1/orders/{$order->id}/status")->assertStatus(422);
        $this->assertSame('completed', Order::find($order->id)->status->value);
    }

    public function test_kasir_tidak_boleh_mengubah_status(): void
    {
        $order = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Cashier));

        $this->postJson("/api/v1/orders/{$order->id}/status")->assertForbidden();
    }

    public function test_kurir_tidak_boleh_melihat_order(): void
    {
        $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Driver));

        $this->getJson('/api/v1/orders')->assertForbidden();
    }

    public function test_batal_hanya_dari_received(): void
    {
        $order = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Manager));

        $this->postJson("/api/v1/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $second = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Operator));
        $this->postJson("/api/v1/orders/{$second->id}/status")->assertOk();

        Sanctum::actingAs($this->actor(Role::Manager));
        $this->postJson("/api/v1/orders/{$second->id}/cancel")->assertStatus(422);
    }

    public function test_order_tenant_lain_tidak_terlihat_qa03(): void
    {
        $order = $this->createOrder();

        $tenantB = Tenant::factory()->create();
        $intruder = User::factory()->forTenant($tenantB)->withRole(Role::Owner)->create();
        Sanctum::actingAs($intruder);

        $this->getJson('/api/v1/orders')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/orders/{$order->id}")->assertNotFound();
        $this->postJson("/api/v1/orders/{$order->id}/status")->assertNotFound();
    }

    public function test_status_bayar_diturunkan_dari_nominal(): void
    {
        Sanctum::actingAs($this->actor());

        $this->postJson('/api/v1/orders', $this->orderPayload(['paid_amount' => 10000]))
            ->assertCreated()->assertJsonPath('data.payment_status', 'partial');

        $this->postJson('/api/v1/orders', $this->orderPayload(['paid_amount' => 0]))
            ->assertCreated()->assertJsonPath('data.payment_status', 'unpaid');

        $this->postJson('/api/v1/orders', $this->orderPayload(['paid_amount' => 99999]))
            ->assertStatus(422);
    }

    public function test_perubahan_harga_katalog_tidak_mengubah_order_lama(): void
    {
        $order = $this->createOrder();
        $this->service->update(['price_per_unit' => 50000]);

        $this->assertSame(27500, Order::find($order->id)->total);
        $this->assertSame(11000, Order::find($order->id)->items->first()->unit_price);
    }

    public function test_operator_boleh_melihat_detail_order(): void
    {
        $order = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Operator));

        $this->getJson("/api/v1/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.ticket', $order->ticket);
    }

    public function test_kurir_tidak_boleh_melihat_detail_order(): void
    {
        $order = $this->createOrder();
        Sanctum::actingAs($this->actor(Role::Driver));

        $this->getJson("/api/v1/orders/{$order->id}")->assertForbidden();
    }

    public function test_order_tanpa_item_ditolak(): void
    {
        Sanctum::actingAs($this->actor());

        $this->postJson('/api/v1/orders', $this->orderPayload(['items' => []]))
            ->assertStatus(422);
    }

    public function test_qty_nol_dan_bayar_negatif_ditolak(): void
    {
        Sanctum::actingAs($this->actor());

        $this->postJson('/api/v1/orders', $this->orderPayload([
            'items' => [['service_id' => $this->service->id, 'qty' => 0]],
        ]))->assertStatus(422);

        $this->postJson('/api/v1/orders', $this->orderPayload(['paid_amount' => -1000]))
            ->assertStatus(422);
    }

    public function test_id_non_numerik_404_bukan_500(): void
    {
        Sanctum::actingAs($this->actor());

        $this->getJson('/api/v1/orders/abc')->assertNotFound();
    }
}

<?php

namespace Tests\Feature\Operations;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Support\Notifications\OrderNotification;
use App\Domains\Support\Notifications\PickupTaskNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $owner;

    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $this->owner = User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create();
        $this->manager = User::factory()->forTenant($this->tenant)->withRole(Role::Manager)->create();
    }

    private function orderPayload(): array
    {
        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create(['price_per_unit' => 10000]);

        return [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ];
    }

    public function test_order_baru_memberitahu_owner_dan_manajer(): void
    {
        Notification::fake();
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());

        $this->postJson('/api/v1/orders', $this->orderPayload())->assertCreated();

        Notification::assertSentTo([$this->owner, $this->manager], OrderNotification::class);
    }

    public function test_order_ready_memberitahu_staff(): void
    {
        Notification::fake();
        Sanctum::actingAs($this->owner);

        $id = $this->postJson('/api/v1/orders', $this->orderPayload())->json('data.id');

        $operator = User::factory()->forTenant($this->tenant)->withRole(Role::Operator)->create();
        Sanctum::actingAs($operator);
        foreach (['washing', 'drying', 'ironing', 'ready'] as $expected) {
            $this->postJson("/api/v1/orders/{$id}/status")->assertOk()->assertJsonPath('data.status', $expected);
        }

        Notification::assertSentTo(
            [$this->owner],
            OrderNotification::class,
            fn (OrderNotification $n) => $n->event === 'ready'
        );
    }

    public function test_task_baru_memberitahu_kurir(): void
    {
        Notification::fake();
        $driver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $orderId = $this->postJson('/api/v1/orders', $this->orderPayload())->json('data.id');

        Sanctum::actingAs($this->manager);
        $this->postJson('/api/v1/delivery-tasks', [
            'order_id' => $orderId,
            'type' => 'pickup',
            'scheduled_at' => now()->addHours(5)->toIso8601String(),
            'driver_id' => $driver->id,
        ])->assertCreated();

        Notification::assertSentTo([$driver], PickupTaskNotification::class);
    }

    public function test_daftar_notifikasi_hanya_milik_sendiri(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->postJson('/api/v1/orders', $this->orderPayload())->assertCreated();

        Sanctum::actingAs($this->owner);
        $list = $this->getJson('/api/v1/notifications')->assertOk();
        $this->assertGreaterThanOrEqual(1, count($list->json('data')));

        $tenantB = Tenant::factory()->create();
        Sanctum::actingAs(User::factory()->forTenant($tenantB)->withRole(Role::Owner)->create());
        $this->getJson('/api/v1/notifications')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_tandai_dibaca_dan_hitung_belum_dibaca(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->postJson('/api/v1/orders', $this->orderPayload())->assertCreated();

        Sanctum::actingAs($this->owner);
        $this->getJson('/api/v1/notifications/unread-count')->assertOk()->assertJsonPath('data.unread', 1);

        $id = $this->getJson('/api/v1/notifications')->json('data.0.id');
        $this->postJson("/api/v1/notifications/{$id}/read")->assertOk();

        $this->getJson('/api/v1/notifications/unread-count')->assertOk()->assertJsonPath('data.unread', 0);
    }

    public function test_tidak_bisa_membaca_notifikasi_orang_lain(): void
    {
        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->postJson('/api/v1/orders', $this->orderPayload())->assertCreated();

        Sanctum::actingAs($this->owner);
        $foreignId = $this->getJson('/api/v1/notifications')->json('data.0.id');

        Sanctum::actingAs($this->manager);
        $this->postJson("/api/v1/notifications/{$foreignId}/read")->assertNotFound();
    }
}

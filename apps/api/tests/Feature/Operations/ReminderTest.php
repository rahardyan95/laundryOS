<?php

namespace Tests\Feature\Operations;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Operations\Models\DeliveryTask;
use App\Domains\Support\Notifications\PickupTaskNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReminderTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $manager;

    private User $driver;

    private int $orderId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $this->manager = User::factory()->forTenant($this->tenant)->withRole(Role::Manager)->create();
        $this->driver = User::factory()->forTenant($this->tenant)->withRole(Role::Driver)->create();
        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create(['price_per_unit' => 10000]);

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->orderId = $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->json('data.id');
    }

    private function makeTask(array $overrides = []): DeliveryTask
    {
        Sanctum::actingAs($this->manager);

        $id = $this->postJson('/api/v1/delivery-tasks', array_merge([
            'order_id' => $this->orderId,
            'type' => 'pickup',
            'scheduled_at' => now()->addHours(5)->toIso8601String(),
            'driver_id' => $this->driver->id,
        ], $overrides))->json('data.id');

        return DeliveryTask::find($id);
    }

    public function test_reminder_hanya_untuk_task_due_dan_belum_dikirim(): void
    {
        Notification::fake();

        $due = $this->makeTask();
        $this->makeTask(['scheduled_at' => now()->addDays(5)->toIso8601String()]);

        $this->artisan('pickup:remind')->assertSuccessful();

        Notification::assertSentTo([$this->driver], PickupTaskNotification::class);
        $this->assertNotNull($due->fresh()->reminder_sent_at);
    }

    public function test_reminder_tidak_kirim_ganda_dan_lewati_done(): void
    {
        Notification::fake();

        $due = $this->makeTask();
        $this->artisan('pickup:remind')->assertSuccessful();
        $this->artisan('pickup:remind')->assertSuccessful();

        // 1x saat assign + 1x reminder; run kedua tidak menambah.
        Notification::assertSentTimes(PickupTaskNotification::class, 2);
        $this->assertNotNull($due->fresh()->reminder_sent_at);
    }
}

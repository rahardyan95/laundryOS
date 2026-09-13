<?php

namespace Tests\Feature\Support;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\DeviceToken;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Support\Push\PushNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FakePushNotifier implements PushNotifier
{
    /** @var list<array{tokens: array<int, string>, title: string, body: string}> */
    public array $calls = [];

    public function send(iterable $tokens, string $title, string $body, array $data = []): void
    {
        $this->calls[] = [
            'tokens' => is_array($tokens) ? $tokens : iterator_to_array($tokens),
            'title' => $title,
            'body' => $body,
        ];
    }
}

class PushTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    public function test_perangkat_dapat_mendaftar_dan_menghapus_token(): void
    {
        $tenant = Tenant::factory()->create();
        $owner = User::factory()->forTenant($tenant)->withRole(Role::Owner)->create();
        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/auth/device-token', ['token' => 'fcm-1', 'platform' => 'android'])
            ->assertOk();
        $this->assertDatabaseHas('device_tokens', ['token' => 'fcm-1', 'user_id' => $owner->id]);

        $this->deleteJson('/api/v1/auth/device-token', ['token' => 'fcm-1'])->assertOk();
        $this->assertDatabaseCount('device_tokens', 0);
    }

    public function test_order_baru_mengirim_push_ke_owner(): void
    {
        Notification::fake();
        $fake = new FakePushNotifier;
        $this->app->instance(PushNotifier::class, $fake);

        $this->tenant = Tenant::factory()->create();
        $this->outlet = Outlet::factory()->forTenant($this->tenant)->create();
        $owner = User::factory()->forTenant($this->tenant)->withRole(Role::Owner)->create();
        DeviceToken::create(['user_id' => $owner->id, 'token' => 'fcm-owner', 'platform' => 'android']);

        $customer = Customer::factory()->forTenant($this->tenant)->forOutlet($this->outlet)->create();
        $service = Service::factory()->forTenant($this->tenant)->create(['price_per_unit' => 10000]);

        Sanctum::actingAs(User::factory()->forTenant($this->tenant)->withRole(Role::Cashier)->create());
        $this->postJson('/api/v1/orders', [
            'outlet_id' => $this->outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 1]],
            'payment_method' => 'cash',
            'paid_amount' => 10000,
        ])->assertCreated();

        $this->assertNotEmpty($fake->calls);
        $this->assertContains('fcm-owner', $fake->calls[0]['tokens']);
    }
}

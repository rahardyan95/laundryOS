<?php

namespace Tests\Feature\Ordering;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Actions\CreateOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackOrderTest extends TestCase
{
    use RefreshDatabase;

    private string $ticket;

    private string $phone = '0812-3345-6712';

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::factory()->create();
        $outlet = Outlet::factory()->forTenant($tenant)->create();
        $customer = Customer::factory()->forTenant($tenant)->forOutlet($outlet)->create([
            'phone' => $this->phone,
        ]);
        $service = Service::factory()->forTenant($tenant)->create(['price_per_unit' => 10000]);
        $actor = User::factory()->forTenant($tenant)->forOutlet($outlet)->withRole(Role::Cashier)->create();

        $order = app(CreateOrder::class)->handle($actor, [
            'outlet_id' => $outlet->id,
            'customer_id' => $customer->id,
            'items' => [['service_id' => $service->id, 'qty' => 2]],
            'payment_method' => 'cash',
            'paid_amount' => 0,
        ]);

        $this->ticket = $order->ticket;
    }

    public function test_lacak_dengan_ticket_dan_telepon_benar(): void
    {
        $this->postJson('/api/v1/track', [
            'ticket' => $this->ticket,
            'phone' => '081233456712',
        ])
            ->assertOk()
            ->assertJsonPath('data.ticket', $this->ticket)
            ->assertJsonPath('data.status', 'received')
            ->assertJsonPath('data.total', 20000)
            ->assertJsonStructure(['data' => ['ticket', 'status', 'items', 'total', 'history']]);
    }

    public function test_respons_tidak_membocorkan_data_sensitif(): void
    {
        $body = $this->postJson('/api/v1/track', [
            'ticket' => $this->ticket,
            'phone' => $this->phone,
        ])->json('data');

        $this->assertArrayNotHasKey('phone', $body);
        $this->assertArrayNotHasKey('address', $body);
        $this->assertArrayNotHasKey('paid_amount', $body);
        $this->assertArrayNotHasKey('payment_method', $body);
    }

    public function test_telepon_salah_404(): void
    {
        $this->postJson('/api/v1/track', [
            'ticket' => $this->ticket,
            'phone' => '080000000000',
        ])->assertNotFound();
    }

    public function test_ticket_tidak_dikenal_404(): void
    {
        $this->postJson('/api/v1/track', [
            'ticket' => 'XXX-20000101-999',
            'phone' => $this->phone,
        ])->assertNotFound();
    }

    public function test_validasi_input(): void
    {
        $this->postJson('/api/v1/track', [])->assertStatus(422);
    }

    public function test_track_dibatasi_rate_limit(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/v1/track', [
                'ticket' => $this->ticket,
                'phone' => $this->phone,
            ])->assertOk();
        }

        $this->postJson('/api/v1/track', [
            'ticket' => $this->ticket,
            'phone' => $this->phone,
        ])->assertStatus(429);
    }
}

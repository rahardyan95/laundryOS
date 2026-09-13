<?php

namespace Tests\Unit\Identity;

use App\Domains\Catalog\Policies\CustomerPolicy;
use App\Domains\Catalog\Policies\ServicePolicy;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Policies\OutletPolicy;
use App\Domains\Ordering\Policies\OrderPolicy;
use PHPUnit\Framework\TestCase;

class PolicyTest extends TestCase
{
    private function userWithRole(Role $role): User
    {
        return new User(['role' => $role]);
    }

    public function test_operator_boleh_melihat_order_tapi_tidak_membuat(): void
    {
        $policy = new OrderPolicy;
        $operator = $this->userWithRole(Role::Operator);

        $this->assertTrue($policy->viewAny($operator));
        $this->assertFalse($policy->create($operator));
        $this->assertTrue($policy->updateStatus($operator));
    }

    public function test_kasir_boleh_membuat_order_tapi_tidak_mengubah_status(): void
    {
        $policy = new OrderPolicy;
        $cashier = $this->userWithRole(Role::Cashier);

        $this->assertTrue($policy->create($cashier));
        $this->assertFalse($policy->updateStatus($cashier));
    }

    public function test_kurir_tidak_boleh_melihat_order(): void
    {
        $this->assertFalse((new OrderPolicy)->viewAny($this->userWithRole(Role::Driver)));
    }

    public function test_kasir_boleh_mengelola_pelanggan_tapi_tidak_layanan(): void
    {
        $cashier = $this->userWithRole(Role::Cashier);

        $this->assertTrue((new CustomerPolicy)->create($cashier));
        $this->assertFalse((new ServicePolicy)->create($cashier));
    }

    public function test_manajer_boleh_mengelola_layanan_dan_outlet(): void
    {
        $manager = $this->userWithRole(Role::Manager);

        $this->assertTrue((new ServicePolicy)->create($manager));
        $this->assertTrue((new OutletPolicy)->viewAny($manager));
    }

    public function test_operator_tidak_boleh_melihat_kas_dan_pengaturan(): void
    {
        $operator = $this->userWithRole(Role::Operator);

        $this->assertFalse((new CustomerPolicy)->viewAny($operator));
        $this->assertFalse((new ServicePolicy)->viewAny($operator));
    }
}

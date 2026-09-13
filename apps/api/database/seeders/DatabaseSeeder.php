<?php

namespace Database\Seeders;

use App\Domains\Catalog\Models\Customer;
use App\Domains\Catalog\Models\Service;
use App\Domains\Identity\Enums\PlanTier;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Enums\TenantStatus;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Ordering\Actions\CancelOrder;
use App\Domains\Ordering\Actions\CreateOrder;
use App\Domains\Ordering\Actions\TransitionOrderStatus;
use App\Domains\Ordering\Enums\OrderStatus;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create([
            'name' => 'Laundry Segar Nusantara',
            'plan' => PlanTier::Growth,
            'status' => TenantStatus::Active,
        ]);

        $kemang = Outlet::create([
            'tenant_id' => $tenant->id,
            'code' => 'KMG',
            'name' => 'LaundryOS Kemang',
            'address' => 'Jl. Kemang Raya No. 21, Jakarta Selatan',
            'phone' => '021-7199-2101',
        ]);
        $tebet = Outlet::create([
            'tenant_id' => $tenant->id,
            'code' => 'TBT',
            'name' => 'LaundryOS Tebet',
            'address' => 'Jl. Tebet Raya No. 8, Jakarta Selatan',
            'phone' => '021-7199-2102',
        ]);

        $users = [];
        foreach ([
            ['Budi Santoso', 'owner@laundryos.test', Role::Owner, $kemang],
            ['Sari Dewi', 'manager@laundryos.test', Role::Manager, $kemang],
            ['Rina Amelia', 'kasir@laundryos.test', Role::Cashier, $kemang],
            ['Joko Prabowo', 'operator@laundryos.test', Role::Operator, $kemang],
            ['Ketut Arya', 'kurir@laundryos.test', Role::Driver, $kemang],
            ['Andi Kurnia', 'kasir.tbt@laundryos.test', Role::Cashier, $tebet],
        ] as [$name, $email, $role, $outlet]) {
            $users[$email] = User::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => $name,
                'email' => $email,
                'password' => 'password',
                'role' => $role,
            ]);
        }

        $customerData = [
            ['Dewi Lestari', '081233456712', $kemang, 'Jl. Bangka IX No. 4'],
            ['Agus Prasetyo', '081322991042', $kemang, 'Perumahan Kemang Timur Blok C2'],
            ['Putu Ayu Wulandari', '087855613320', $kemang, null],
            ['Hendra Wijaya', '085611028804', $kemang, 'Jl. Prapanca Raya No. 17'],
            ['Ratna Kusuma', '081288776610', $kemang, null],
            ['Fajar Nugroho', '082144329187', $tebet, null],
            ['Intan Permata', '081966542201', $kemang, null],
            ['Bayu Setiawan', '085299114478', $tebet, null],
        ];
        $customers = [];
        foreach ($customerData as [$name, $phone, $outlet, $address]) {
            $customers[$name] = Customer::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'name' => $name,
                'phone' => $phone,
                'address' => $address,
            ]);
        }

        $serviceData = [
            ['Cuci Kering Reguler', 'kg', 7000, 48, true],
            ['Cuci Setrika', 'kg', 11000, 48, true],
            ['Setrika Saja', 'kg', 6000, 24, true],
            ['Cuci Kilat 6 Jam', 'kg', 16000, 6, true],
            ['Cuci Sepatu', 'pasang', 30000, 72, true],
            ['Bed Cover Besar', 'pcs', 45000, 72, false],
        ];
        $services = [];
        foreach ($serviceData as [$name, $unit, $price, $hours, $active]) {
            $services[$name] = Service::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => null,
                'name' => $name,
                'unit' => $unit,
                'price_per_unit' => $price,
                'estimated_hours' => $hours,
                'active' => $active,
            ]);
        }

        $create = app(CreateOrder::class);
        $advance = app(TransitionOrderStatus::class);
        $kasir = $users['kasir@laundryos.test'];
        $kasirTbt = $users['kasir.tbt@laundryos.test'];
        $operator = $users['operator@laundryos.test'];

        $make = function (
            User $actor,
            Outlet $outlet,
            Customer $customer,
            array $items,
            int $paid,
            OrderStatus $target = OrderStatus::Received,
            bool $cancel = false,
            int $daysAgo = 0
        ) use ($create, $advance, $operator): void {
            $order = $create->handle($actor, [
                'outlet_id' => $outlet->id,
                'customer_id' => $customer->id,
                'items' => array_map(
                    fn ($pair) => ['service_id' => $pair[0]->id, 'qty' => $pair[1]],
                    $items
                ),
                'payment_method' => $paid > 0 ? 'cash' : null,
                'paid_amount' => $paid,
            ]);

            if ($cancel) {
                app(CancelOrder::class)->handle($order, $actor, 'Demo: dibatalkan customer');

                return;
            }

            $cursor = OrderStatus::Received;
            while ($cursor !== $target) {
                $order = $advance->advance($order, $operator);
                $cursor = $order->status;
            }

            if ($daysAgo > 0) {
                $when = now()->subDays($daysAgo);
                $order->forceFill(['created_at' => $when, 'updated_at' => $when])->saveQuietly();
                $order->history()->update(['created_at' => $when, 'updated_at' => $when]);
                $order->items()->update(['created_at' => $when, 'updated_at' => $when]);
            }
        };

        $CS = $services['Cuci Setrika'];
        $CK = $services['Cuci Kering Reguler'];
        $SS = $services['Setrika Saja'];
        $CKilat = $services['Cuci Kilat 6 Jam'];
        $Sepatu = $services['Cuci Sepatu'];

        $make($kasir, $kemang, $customers['Dewi Lestari'], [[$CS, 4.5]], 49500, OrderStatus::Washing);
        $make($kasir, $kemang, $customers['Agus Prasetyo'], [[$CK, 3], [$Sepatu, 1]], 25000, OrderStatus::Drying);
        $make($kasir, $kemang, $customers['Putu Ayu Wulandari'], [[$CKilat, 2.5]], 40000, OrderStatus::Ready);
        $make($kasir, $kemang, $customers['Hendra Wijaya'], [[$SS, 5]], 0, OrderStatus::Ironing);
        $make($kasir, $kemang, $customers['Ratna Kusuma'], [[$CK, 6]], 0, OrderStatus::Received);
        $make($kasir, $kemang, $customers['Dewi Lestari'], [[$CS, 3.2]], 35200, OrderStatus::Completed, false, 2);
        $make($kasir, $kemang, $customers['Agus Prasetyo'], [[$CK, 4]], 28000, OrderStatus::Completed, false, 3);
        $make($kasirTbt, $tebet, $customers['Fajar Nugroho'], [[$CS, 5.5]], 60500, OrderStatus::Washing);
        $make($kasirTbt, $tebet, $customers['Bayu Setiawan'], [[$CKilat, 1.8]], 28800, OrderStatus::Ready);
        $make($kasirTbt, $tebet, $customers['Intan Permata'], [[$CK, 2.2]], 0, OrderStatus::Received);
        $make($kasirTbt, $tebet, $customers['Fajar Nugroho'], [[$Sepatu, 1]], 0, OrderStatus::Received, true);
    }
}

<?php

namespace App\Console\Commands;

use App\Domains\Identity\Enums\PlanTier;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Enums\TenantStatus;
use App\Domains\Identity\Models\Outlet;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Identity\Scopes\TenantScope;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Provisioning instalasi baru: model launch LaundryOS adalah tenant yang
 * diprovisi operator (tanpa signup mandiri), jadi perintah ini adalah satu-satunya
 * jalan membuat tenant + outlet pertama + akun owner di produksi.
 */
class ProvisionTenant extends Command
{
    protected $signature = 'tenant:provision
        {--name= : Nama tenant}
        {--outlet= : Nama outlet pertama}
        {--email= : Email owner}
        {--password= : Kata sandi owner (minimal 8 karakter)}
        {--plan=growth : Paket langganan: starter|growth|multi_outlet}';

    protected $description = 'Membuat tenant, outlet pertama, dan akun owner.';

    public function handle(): int
    {
        $name = trim((string) $this->option('name'));
        $outletName = trim((string) $this->option('outlet'));
        $email = mb_strtolower(trim((string) $this->option('email')));
        $password = (string) $this->option('password');
        $plan = PlanTier::tryFrom(trim((string) $this->option('plan')));

        $required = ['--name' => $name, '--outlet' => $outletName, '--email' => $email, '--password' => $password];
        $missing = array_keys(array_filter($required, fn (string $value): bool => $value === ''));

        if ($missing !== []) {
            $this->error('Opsi wajib diisi: '.implode(', ', $missing));

            return self::FAILURE;
        }

        if ($plan === null) {
            $this->error('Paket tidak dikenal. Pilihan: '.implode(', ', array_column(PlanTier::cases(), 'value')));

            return self::FAILURE;
        }

        if (mb_strlen($password) < 8) {
            $this->error('Kata sandi minimal 8 karakter.');

            return self::FAILURE;
        }

        // Email unik lintas tenant. User tidak memakai scope tenant, tetapi
        // pemeriksaan ini sengaja eksplisit supaya tidak bergantung pada itu.
        if (User::withoutGlobalScope(TenantScope::class)->where('email', $email)->exists()) {
            $this->error("Email {$email} sudah terdaftar — tidak ada perubahan.");

            return self::FAILURE;
        }

        $tenant = Tenant::create([
            'name' => $name,
            'plan' => $plan,
            'status' => TenantStatus::Active,
        ]);

        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'code' => $this->outletCode($outletName, $tenant->id),
            'name' => $outletName,
        ]);

        $owner = User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Pemilik '.$name,
            'email' => $email,
            'password' => $password,
            'role' => Role::Owner,
        ]);

        $this->info("Tenant #{$tenant->id} \"{$tenant->name}\" ({$plan->value}) dibuat.");
        $this->info("Outlet #{$outlet->id} \"{$outlet->name}\" kode {$outlet->code} dibuat.");
        $this->info("Owner #{$owner->id} {$owner->email} siap login.");

        return self::SUCCESS;
    }

    /**
     * Kode outlet dipakai pada nomor ticket, jadi harus unik di dalam tenant.
     */
    private function outletCode(string $outletName, int $tenantId): string
    {
        $letters = preg_replace('/[^A-Za-z0-9]/', '', $outletName) ?? '';
        $base = Str::upper(Str::substr($letters, 0, 3));

        if ($base === '') {
            $base = 'OUT';
        }

        $base = str_pad($base, 3, 'X');
        $code = $base;
        $suffix = 1;

        while (Outlet::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->where('code', $code)
            ->exists()) {
            $code = Str::substr($base, 0, 2).$suffix;
            $suffix++;
        }

        return $code;
    }
}

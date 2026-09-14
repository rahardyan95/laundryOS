<?php

namespace App\Console\Commands;

use App\Domains\Identity\Enums\PlanTier;
use App\Domains\Identity\Enums\Role;
use App\Domains\Identity\Models\Tenant;
use App\Domains\Identity\Models\User;
use App\Domains\Support\Actions\RecordActivity;
use Illuminate\Console\Command;

/**
 * Perubahan paket adalah keputusan operator (ditagih di luar aplikasi), bukan
 * aksi self-service tenant — lihat SubscriptionController.
 */
class ChangeTenantPlan extends Command
{
    protected $signature = 'tenant:plan
        {tenant : ID tenant atau email owner}
        {plan : Paket baru: starter|growth|multi_outlet}';

    protected $description = 'Mengubah paket langganan sebuah tenant.';

    public function handle(RecordActivity $activity): int
    {
        $plan = PlanTier::tryFrom(trim((string) $this->argument('plan')));

        if ($plan === null) {
            $this->error('Paket tidak dikenal. Pilihan: '.implode(', ', array_column(PlanTier::cases(), 'value')));

            return self::FAILURE;
        }

        $tenant = $this->resolveTenant((string) $this->argument('tenant'));

        if ($tenant === null) {
            $this->error('Tenant tidak ditemukan. Isi ID tenant atau email owner-nya.');

            return self::FAILURE;
        }

        $current = $tenant->getRawOriginal('plan');

        if ($current === $plan->value) {
            $this->info("Tenant #{$tenant->id} sudah memakai paket {$plan->value} — tidak ada perubahan.");

            return self::SUCCESS;
        }

        $tenant->update(['plan' => $plan->value]);

        // FRD §6: aksi kritis harus punya actor dan waktu. Actor = owner tenant.
        $owner = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('role', Role::Owner)
            ->first();

        if ($owner !== null) {
            $activity->handle($owner, 'subscription.plan_changed', $tenant, [
                'from' => $current,
                'to' => $plan->value,
                'source' => 'operator',
            ]);
        }

        $this->info("Tenant #{$tenant->id} \"{$tenant->name}\": {$current} → {$plan->value}");

        return self::SUCCESS;
    }

    private function resolveTenant(string $needle): ?Tenant
    {
        $needle = trim($needle);

        if ($needle === '') {
            return null;
        }

        if (ctype_digit($needle)) {
            return Tenant::query()->whereKey((int) $needle)->first();
        }

        return Tenant::query()
            ->whereIn('id', User::query()->where('email', mb_strtolower($needle))->select('tenant_id'))
            ->first();
    }
}

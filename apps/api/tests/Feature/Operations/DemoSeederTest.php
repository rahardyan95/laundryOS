<?php

namespace Tests\Feature\Operations;

use App\Domains\Operations\Models\CashClosing;
use App\Domains\Operations\Models\CashEntry;
use App\Domains\Operations\Models\DeliveryTask;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Instalasi bersih harus langsung punya data untuk tab Tugas (kurir) dan Kas —
 * tanpa itu peran kurir/kasir tidak bisa dinilai saat demo.
 */
class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_mengisi_tugas_antar_jemput_dan_kas(): void
    {
        $this->seed();

        $this->assertGreaterThanOrEqual(3, DeliveryTask::withoutGlobalScopes()->count());
        $this->assertGreaterThanOrEqual(1, CashEntry::withoutGlobalScopes()->count());
        $this->assertGreaterThanOrEqual(1, CashClosing::withoutGlobalScopes()->count());
    }

    public function test_tugas_demo_mencakup_tiga_tahap_yang_bisa_dilihat_kurir(): void
    {
        $this->seed();

        $statuses = DeliveryTask::withoutGlobalScopes()->pluck('status')->map->value->all();

        foreach (['assigned', 'in_progress', 'done'] as $expected) {
            $this->assertContains($expected, $statuses);
        }
    }

    public function test_kas_demo_punya_pemasukan_dan_pengeluaran(): void
    {
        $this->seed();

        $types = CashEntry::withoutGlobalScopes()->pluck('type')->map->value->unique()->values()->all();

        $this->assertEqualsCanonicalizing(['income', 'expense'], $types);
    }
}

<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()->assertJson([
            'status' => 'ok',
            'checks' => ['database' => 'ok', 'cache' => 'ok'],
        ]);
    }

    public function test_health_returns_503_when_database_down(): void
    {
        DB::shouldReceive('select')->once()->andThrow(new \RuntimeException('db mati'));

        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(503)->assertJson([
            'status' => 'degraded',
            'checks' => ['database' => 'fail'],
        ]);
    }

    public function test_health_returns_503_when_cache_down(): void
    {
        Cache::shouldReceive('store')->once()->andThrow(new \RuntimeException('cache mati'));

        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(503)->assertJson([
            'status' => 'degraded',
            'checks' => ['database' => 'ok', 'cache' => 'fail'],
        ]);
    }

    public function test_liveness_up_returns_200(): void
    {
        $this->get('/up')->assertOk();
    }
}

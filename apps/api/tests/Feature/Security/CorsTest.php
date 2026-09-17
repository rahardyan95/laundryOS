<?php

namespace Tests\Feature\Security;

use Tests\TestCase;

class CorsTest extends TestCase
{
    public function test_preflight_origin_terdaftar_mengembalikan_origin_persis(): void
    {
        config(['cors.allowed_origins' => ['https://app.laundryos.test']]);

        $response = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
            'HTTP_ORIGIN' => 'https://app.laundryos.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // Preflight yang sah dijawab 204 (CorsService::handlePreflightRequest)
        // dengan origin persis terdaftar + kredensial.
        $response->assertStatus(204);
        $this->assertSame(
            'https://app.laundryos.test',
            $response->headers->get('Access-Control-Allow-Origin')
        );
        $this->assertSame(
            'true',
            $response->headers->get('Access-Control-Allow-Credentials')
        );
    }

    public function test_preflight_origin_jahat_tidak_pernah_digemakan(): void
    {
        config(['cors.allowed_origins' => ['https://app.laundryos.test']]);

        $response = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
            'HTTP_ORIGIN' => 'https://jahat.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // Browser hanya mengizinkan bila ACAO cocok persis dengan Origin
        // pengirim — echo satu-satunya origin terdaftar tidak memberi akses
        // ke jahat.example. Yang dilarang keras: '*' dan gema origin jahat.
        $allowed = $response->headers->get('Access-Control-Allow-Origin');
        $this->assertNotSame('*', $allowed);
        $this->assertNotSame('https://jahat.example', $allowed);
    }

    public function test_wildcard_tidak_pernah_dipakai(): void
    {
        config(['cors.allowed_origins' => ['https://app.laundryos.test']]);

        $response = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
            'HTTP_ORIGIN' => 'https://app.laundryos.test',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        $this->assertNotSame('*', $response->headers->get('Access-Control-Allow-Origin'));
    }
}

import { defineConfig } from "@playwright/test";

/**
 * E2E terhadap backend Laravel nyata (bukan mock).
 * Prasyarat: `cd infra && docker compose up -d && docker compose run --rm -T api php artisan migrate:fresh --seed`
 * dan `apps/api/.env` memuat SANCTUM_STATEFUL_DOMAINS + FRONTEND_URL untuk localhost:3100.
 */
export default defineConfig({
  testDir: "./e2e-laravel",
  workers: 1,
  timeout: 60 * 1000,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "pnpm dev --port 3100",
    url: "http://localhost:3100/login",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_MODE: "laravel",
      NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
    },
  },
});

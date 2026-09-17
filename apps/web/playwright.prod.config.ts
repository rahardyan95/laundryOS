import { defineConfig } from "@playwright/test";

/**
 * E2E lawan production build (T11 go-live): `next build + next start`.
 * Prasyarat: server prod sudah jalan di :3100 (dinyalakan job CI sebelum
 * spec dijalankan) — jadi TIDAK ada webServer di sini agar dev server
 * tidak ikut hidup dan hasil benar-benar ≈ produksi.
 */
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
  },
});

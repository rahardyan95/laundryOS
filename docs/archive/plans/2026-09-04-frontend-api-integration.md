# Implementation Plan — Frontend ↔ API Integration (LaravelApiClient)

**Tanggal:** 2026-09-04
**Basis:** Kontrak `ApiClient` (apps/web) ↔ endpoint R1 (apps/api). Auth token Sanctum (bukan cookie SPA — keputusan: token di sessionStorage, sesederhana mock; cookie httpOnly ditunda ke hardening pasca-MVP).
**Strategi:** TDD — skrip verifikasi runtime ditulis dulu (RED: import gagal), implementasi, skrip hijau, skrip dihapus.

> Skill: `writing-plans`, `test-driven-development`, `api-and-interface-design` (mapping kontrak), `security-and-hardening` (token handling), `verification-before-completion` (gate).

## Prinsip

1. **Kontrak `ApiClient` tidak berubah** kecuali penambahan `logout()` (diperlukan untuk revoke token; Mock ikut implementasi).
2. **Mapping terpusat** di `laravel/mappers.ts` — satu arah per entitas, snake_case→camelCase. Enum string identik, teruskan apa adanya.
3. **Pagination diikuti** (`fetchAll` loop `meta.last_page`) — tanpa `per_page=100` hack.
4. **Error konsisten:** HTTP non-2xx → `ApiError(status, message)` dari body `{message}`; gagal jaringan → `ApiError(0, 'Tidak dapat terhubung ke server.')`.
5. **Mode default tetap mock** (`NEXT_PUBLIC_API_MODE=mock`); mode laravel via env. Tidak ada perilaku berubah tanpa opt-in.

## File Structure

```
apps/web/src/lib/api/
├── api-client.ts                 # + logout(): Promise<void> (abstract)
├── client.ts                     # factory baca NEXT_PUBLIC_API_MODE / NEXT_PUBLIC_API_URL
├── session.ts                    # + token()/setToken() (key laundryos.token); clear() ikut hapus token
├── mock/mock-api-client.ts       # + logout(): clear session
└── laravel/
    ├── http-client.ts            # HttpClient: baseUrl, token provider, get/post/patch/delete, fetchAll
    ├── mappers.ts                # mapUser/Tenant/Outlet/Customer/Service/Order/DashboardSummary
    └── laravel-api-client.ts     # LaravelApiClient extends ApiClient
apps/web/.env.example             # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_MODE (contoh; .env.local gitignored)
apps/api: config/cors.php publish + allowed_origins dari FRONTEND_URL (default http://localhost:3000)
```

## Task List

### I1 — CORS backend (RED: preflight curl tanpa header ACAO → GREEN: header hadir)
- `php artisan config:publish cors`; `allowed_origins` dari `env('FRONTEND_URL', 'http://localhost:3000')`.
- Verifikasi: `curl -X OPTIONS` dengan `Origin: http://localhost:3000` mengembalikan `Access-Control-Allow-Origin`.

### I2 — SessionManager token + HttpClient + mappers (RED: skrip tsx import gagal)
- `SessionManager.token()/setToken()`; `clear()` hapus token juga.
- `HttpClient` class: constructor(baseUrl, getToken); `get/post/patch/delete(path, body?)`; private `request()` (fetch + JSON + ApiError mapping); `fetchAll(path, params)` loop pagination.
- `mappers.ts`: 7 fungsi map murni.
- Verifikasi: `tsc --noEmit` (tipe mapping dikunci compiler).

### I3 — LaravelApiClient + factory + logout (RED: skrip verifikasi gagal konek/fungsi)
- `LaravelApiClient extends ApiClient`: semua 13 method + `logout()` (POST /auth/logout, finally clear).
- `login()`: POST /auth/login → simpan token → GET /auth/me → simpan payload → return payload.
- `getMe()`: tanpa token → null; else GET /auth/me (refresh payload, simpan, return).
- `createOrder/updateStatus/cancel`: POST; `upsert*`: id ? PATCH : POST; list: fetchAll dengan `status/q/outlet_id`.
- `client.ts`: `createApiClient()` pilih berdasar `NEXT_PUBLIC_API_MODE`; `.env.example` dokumentasi.
- `Topbar.handleLogout`: `await api.logout()` (ganti clear langsung).
- `MockApiClient.logout()`: `SessionManager.clear()`.
- Verifikasi: skrip tsx vs API live — login valid/salah (200/422), me, CRUD customer/service, create→advance→cancel order + invalid advance 422, dashboard angka konsisten, logout (token tak berlaku lagi). Skrip dihapus setelah hijau.

### I4 — Gate akhir
- `tsc`, `eslint`, `next build` hijau; preflight CORS hijau; catat audit di kedua plan.

## Batas
- Tanpa cookie httpOnly/Sanctum SPA session (keputusan sadar; tercatat sebagai hardening pasca-MVP).
- Tanpa retry/offline queue. Tanpa refresh token (token Sanctum long-lived; revoke saat logout).

## Catatan Audit 2026-09-04 (pasca-I4)

- **26/26 asersi integrasi HIJAU** vs API live (login 200/422, CRUD customer/service, create→advance→cancel + 422 ganda/terminal, filter status, dashboard konsisten, logout→401). Skrip verifikasi dihapus setelah hijau.
- **Insiden DB test isolation (diperbaiki):** seluruh suite ternyata berjalan di DB dev `laundry` (menimpa seed!) karena `phpunit.xml <env force>` kalah dari `$_SERVER` container. Solusi: `<server>` untuk semua var DB → terbukti isolasi (seed dev utuh setelah suite; `laundry_test` terisi). Berlaku juga untuk CI.
- **Temuan mapper:** index order tidak memuat `history` → `Mappers.order` dibuat toleran (`?? []`).
- Gate: `tsc` 0, `eslint` 0, `next build` 0, preflight CORS 204 + ACAO benar.
- Mode default frontend tetap `mock`; aktifkan backend via `NEXT_PUBLIC_API_MODE=laravel` di `.env.local`.

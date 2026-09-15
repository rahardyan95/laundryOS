# Implementation Plan — Frontend 100% Complete

**Tanggal:** 2026-09-04
**Basis:** Gap audit frontend (test suite 0 file, E2E browser belum ada, struk cetak stub, CI web belum ada, US-06 portal customer).
**Strategi:** TDD untuk unit test; Playwright headless Chromium (pengganti chrome-devtools MCP yang tak tersedia di environment ini) untuk E2E + screenshot + console check.

> Skill: `writing-plans`, `test-driven-development`, `browser-testing-with-devtools` (workflow verify-nya: console bersih, screenshot, network), `verification-before-completion`.

## Prinsip

1. **Unit test untuk logika murni** (OrderMachine, Format, Mappers, NavPolicy, SessionManager, HttpClient error mapping) — cepat, tanpa DOM kecuali komponen.
2. **E2E mode mock** (default, deterministik, tanpa backend) + 1 smoke laravel-mode? TIDAK — laravel-mode butuh seed stabil; E2E mock saja (YAGNI).
3. **Struk 80mm**: section print-only di order detail + `@media print` menyembunyikan chrome aplikasi.
4. **Portal publik minimal**: `POST /v1/track {ticket, phone}` (backend, rate-limit default api group) → halaman `/lacak` tanpa auth, data terbatas (tanpa alamat/telepon/pembayaran).
5. **CI web**: lint + tsc + vitest + build (+ playwright Chromium saja agar cepat).

## Task List

### F1 — Vitest + unit test (RED: `vitest run` gagal — setup & file belum ada)
- `pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react` (+ `@testing-library/user-event`? TIDAK — fireEvent cukup).
- `vitest.config.ts` (environment jsdom, setupFiles `src/test/setup.ts` dengan `@testing-library/jest-dom/vitest` + polyfill sessionStorage minimal), script `test: pnpm vitest run`, `test:watch`.
- Test: `order-machine.test.ts` (next/canTransition/label semua status), `format.test.ts` (rupiah/date), `mappers.test.ts` (user/order/dashboard/task/cash/report mapping + Number() coercion string PG), `nav-policy.test.ts` (items per role + label), `status-badge.test.tsx` + `task-status-badge.test.tsx` (render label), `session.test.ts` (set/get/clear/outlet/token).
- **Verifikasi:** `pnpm vitest run` hijau; coverage logika lib ~penuh.

### F2 — Struk cetak
- Komponen `OrderReceipt` (print-only, `hidden print:block`): kop outlet, ticket, tanggal, customer, tabel item, total/dibayar/sisa, status, footer terima kasih; area aplikasi `print:hidden`.
- `@media print` di globals.css: margin struk 80mm, font mono 12px.
- **Verifikasi:** build hijau + screenshot Playwright halaman detail (visual) + cetak CSS terinspeksi.

### F3 — Playwright E2E (RED: config & spec belum ada)
- `pnpm add -D @playwright/test`; `npx playwright install --with-deps chromium` (Linux? Windows host — install chromium saja); `playwright.config.ts` (webServer `pnpm dev` port 3100? pakai 3000 default; baseURL; 1 worker lokal? default).
- Spec `e2e/auth-orders.spec.ts`: (1) login owner via demo chip → dashboard terlihat; (2) buat order via POS (isi customer baru + layanan + simpan) → redirect detail + ticket tampil; (3) lanjut status → badge berubah; (4) logout → kembali ke login. Spec `e2e/smoke.spec.ts`: console error = 0 di dashboard + screenshot tiap halaman utama ke `e2e/screenshots/` (gitignored).
- Script `test:e2e`. **Verifikasi:** `pnpm exec playwright test` hijau + screenshot direview.

### F4 — Portal lacak-cucian + endpoint track (TDD backend dulu)
- Backend RED: `POST /v1/track` ticket+phone valid → 200 data terbatas; salah → 404 tanpa bocor; rate default. GREEN: `TrackController` (cari order by ticket, cocokkan phone, resource terbatas) + test.
- Frontend: route publik `/(public)/lacak/page.tsx` (form ticket+telepon → timeline status), link "Lacak cucian" di halaman login. Tanpa auth layout.
- **Verifikasi:** backend test hijau + E2E lacak (ticket dari order yang baru dibuat) + screenshot.

### F5 — CI web + gate akhir
- `.github/workflows/web.yml`: pnpm install (store cache), lint, tsc, vitest, build, playwright (chromium, `test:e2e` hanya smoke? full E2E — 2 spec, cepat).
- Gate: semua hijau lokal + catat audit di plan ini.

## Batas
- Tanpa visual-regression diff otomatis (screenshot direview manual).
- Tanpa Firefox/WebKit di CI (Chromium saja — YAGNI).
- Tanpa cookie httpOnly / refresh token (tetap pasca-MVP).

## Catatan Audit 2026-09-04 (pasca-F5)

- **F1: Vitest 29/29 hijau** (8 file: machine, format, nav-policy, session, mappers, 3 badge/receipt). Pelajaran: Intl id-ID memakai NBSP (assert dinormalisasi), export class adalah `FLOW`.
- **F2: struk 80mm** (`OrderReceipt` print-only + `@media print`), terverifikasi di build.
- **F3: Playwright 4/4 hijau** + console 0 error + screenshot direview. **Temuan nyata: `TooltipProvider` hilang → crash sidebar** (dari pesan CLI shadcn yang terlewat) — diperbaiki, pola: pesan setup CLI wajib diverifikasi runtime.
- **F4: portal `/lacak` + `POST /v1/track` hijau** (backend 5 tests, E2E 2, mapping live). **Bug kritis tertangkap verifikasi live: relasi `customer` kena fail-closed scope untuk guest → 500** — diperbaiki via scoped eager-load. Pelajaran: exemption console di `TenantScope` menutupi perilaku guest dalam test.
- **F5: CI `web.yml`** (lint+tsc+vitest+build+e2e Chromium). Gate: vitest 29, tsc 0, eslint 0, build 0, e2e 4/4, backend 86/299, pint PASS.
- Frontend 100% complete untuk scope web (R1–R3 + US-06). Sisa pasca-MVP tak berubah.

## Redesign v2 "Pine & Lime" (2026-09-04)
- Palet, font (Plus Jakarta Sans, rekomendasi DB ui-ux-pro-max), logo SVG, sidebar pinus gelap + pil limau, motion restrained + reduced-motion → `apps/web/DESIGN.md` v2.
- E2E 7/7 (tambah viewport mobile 390px, tanpa scroll horizontal), screenshot desktop+mobile direview.
- Pelajaran cascade: override `data-active` via CSS global kalah dari cva shadcn — solusi shadcn-native (edit varian di komponen copy-paste) + verifikasi computed-style di browser, bukan menebak.

## Home + Lacak + Alamat POS (2026-09-04)- POS: form pelanggan-baru kini nama + telepon + alamat (opsional), sama dengan halaman Pelanggan.
- Home `/` publik: metadata SEO (title/deskripsi/OG id_ID), nav session-aware + menu mobile, hero + preview tracker, strip 6 tahap, 6 fitur, 4 peran (dari persona PRD), CTA lacak, footer link-nyata. Tanpa testimoni/pricing/logo-bar palsu (antislop).
- Lacak glow-up: hero pinus + form inline, progress 6 tahap, kartu hasil. E2E home+track hijau; screenshot desktop+mobile direview.
- Gate: tsc/eslint 0, vitest 41, build 0, E2E 9/9.
- Revisi: section home diurutkan ikut menu (Fitur → Alur Kerja → Peran); login split-screen panel pinus + form (ganti kartu kaku).

## Role-aware UI + defect kurir (2026-09-04)

- **Bug #4 diperbaiki:** tombol "Lanjut ke …" tampil untuk semua role (backend benar menolak 403, tapi UI menyesatkan) → aksi order detail kini sesuai peran (advance: owner/manajer/operator; cancel: +kasir), sisanya penjelasan jujur.
- **NavPolicy.allowForPath + RequireRole** di layout dashboard: URL langsung di luar peran dialihkan ke menu pertama peran itu (kurir→/tasks, operator/kasir→/orders).
- Tombol Order Baru disembunyikan untuk operator; create/edit katalog hanya owner/manajer.
- E2E `roles.spec.ts` (4 tests) + screenshot login/dashboard baru direview.
- Home anchor: `scroll-mt-28` + `scroll-padding-top` agar header tak menutupi judul.
- Dashboard: greeting waktu + nama + tanggal/outlet, workload progress bar (ARIA).

## Login stale, workload & struk v2 (2026-09-04)

- **Login "belum berubah" adalah server dev basi** (PID 8196, `next dev` lama di :3000) — dimatikan; screenshot fresh membuktikan split-screen baru live.
- Workload: pipeline 6 sel + highlight TERTINGGI (amber) + ARIA progressbar.
- Struk: kop brand, tabel berbingkai, box total, stempel LUNAS/BELUM LUNAS/DP, B&W thermal-safe; direview via emulasi print + E2E `receipt.spec.ts`.
- Gate: vitest 41, tsc/eslint 0, build 0, E2E 16/16.

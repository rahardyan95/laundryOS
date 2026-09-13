# Implementation Plan — CRUD 100% + Automation Penuh

**Tanggal:** 2026-09-04
**Basis:** Audit matriks CRUD (endpoint × peran) + gap automation. Target: setiap operasi CRUD teruji, setiap fitur terbukti aktif live.
**Strategi:** TDD backend untuk lubang; unit test frontend untuk HttpClient/mapper; E2E untuk alur operasi; live sweep semua endpoint.

> Skill: `writing-plans`, `test-driven-development`, `code-review-and-quality` (lima sumbu untuk temuan), `verification-before-completion`.

## Hasil Audit Matriks (sebelum mulai)

| Area | Lubang ditemukan |
|---|---|
| Delivery tasks | Tanpa endpoint update (policy `update` tak terpakai) → tambah `PATCH /delivery-tasks/{id}` |
| Customers | Update oleh operator (403?) belum dites |
| Services | Update oleh kasir (403?) belum dites |
| Orders | Lihat oleh operator (200?) dan kurir (403?) belum dites |
| Outlets show | Kasir (403?) belum dites |
| Validasi | items kosong, qty 0, paid negatif, amount 0, scheduled lampau (aturan ada, perilaku belum dipin) |
| Frontend unit | HttpClient (error mapping, fetchAll dua bentuk, network fail) + mapper task/cash/notif/subscription belum dites |
| Frontend E2E | Alur customer + kas belum ada; proof upload hanya level API |

## Task List

### C1 — PATCH delivery-tasks (RED → GREEN)
- Test: update driver/jadwal/address oleh manajer → 200; kasir → 403; driver → 403; driver_id bukan kurir → 422; cross-tenant → 404.
- GREEN: `UpdateDeliveryTaskRequest`, `DeliveryTaskController@update`, route PATCH.
- **Verifikasi:** test hijau.

### C2 — Pin RBAC + validasi (RED → GREEN, tanpa kode produksi baru bila sudah benar)
- Tambah ke file test existing: operator update customer 403; kasir update service 403; operator lihat order 200; kurir lihat order 403; kasir lihat outlet detail 403; order items kosong 422; qty 0 422; paid_amount negatif 422; cash amount 0 422.
- Bila ada yang FAIL padahal seharusnya pass → perbaiki produksi (itu temuan, bukan test salah).
- **Verifikasi:** suite hijau.

### C3 — Unit test frontend
- `http-client.test.ts` (vi.stubGlobal fetch): GET kirim token; 404 → ApiError(422? no — status asli + message body); 500 tanpa body → pesan default; network throw → ApiError(0); fetchAll ikut `meta` dan bentuk flat; POST kirim JSON.
- `mappers.test.ts` tambah: task, cash, cashSummary, notification, subscription, report kosong.
- **Verifikasi:** `vitest run` hijau.

### C4 — E2E operations + live sweep
- `e2e/operations.spec.ts`: buat customer (dialog) → tampil di tabel; catat kas → summary berubah; tutup kas → badge Ditutup + entry ditolak (coba catat lagi → error tampil).
- Live sweep via curl: semua endpoint R1–R3 + track + notifications + reports CSV + proof upload + reminder command + worker/scheduler status. Script sekali jalan, bukti output.
- **Verifikasi:** E2E hijau + sweep 100% 2xx/4xx-terduga.

### C5 — Gate + audit
- Backend suite + pint; frontend tsc/eslint/vitest/build/e2e; catat audit di plan ini.

## Batas
- Tanpa delete endpoint (immutable ledger + closing = keputusan desain, bukan lubang).
- Tanpa upload-bukti E2E (tertutup test API + file input standar).

## Catatan Audit 2026-09-04 (pasca-C5)

- **Backend: 109 passed, 363 assertions; pint PASS 143 files.**
- **Frontend: vitest 41/41, E2E 6/6** (tambah operations: customer + kas-tutup-kunci-buka).
- **Live sweep: 45/45** semua endpoint R1–R3 + track + upload multipart + CSV + logout-revoke.
- **C1:** `PATCH /delivery-tasks/{id}` menutup satu-satunya operasi CRUD yang hilang.
- **C4 menemukan 2 bug 500 nyata** (guest/revoked → `Route [login]`; id non-numerik → PG error) — keduanya diperbaiki + dipin regression test.
- DB dev di-seed ulang bersih. Skrip sweep + debug dihapus.
- CRUD 100%: semua operasi + RBAC + validasi + limit + throttle teruji di 3 lapis (unit, API, browser, live).

## Catatan Audit 2026-09-04 (pasca-C5)

- **Backend: 103 passed, 340+ assertions** (C1: PATCH tasks 3; C2: 8 pin RBAC/validasi — produksi sudah benar; regression: guest-tanpa-JSON 401 + id-non-numerik 404).
- **Frontend: vitest 41/41, E2E 6/6** (tambah operations: customer + kas-tutup-kunci-buka), tsc/eslint/build hijau.
- **Live sweep 45/45** semua endpoint incl. upload bukti multipart, CSV, track, logout-revoke.
- **Temuan live yang diperbaiki:** (1) guest/revoked-token → 500 `Route [login] not defined` → `redirectGuestsTo(null)` + render 401 untuk api/*; (2) id non-numerik → 500 PG → `Route::pattern` numerik → 404; (3) 3 FAIL awal sweep adalah bug skrip (interpolasi + Accept header), bukan aplikasi.
- DB dev di-seed ulang bersih (6 users, 11 orders). Skrip sweep + debug dihapus.
- CRUD 100%: setiap operasi create/read/update/list/filter + state machine + closing + limit + throttle teruji otomatis; delete memang tidak ada by design.

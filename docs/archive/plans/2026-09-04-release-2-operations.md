# Implementation Plan — Release 2 Operations (FR-009…011, FR-013)

**Tanggal:** 2026-09-04
**Basis:** PRD Release 2; FR-009 pickup/delivery (Should), FR-010 cash (Must, QA-04), FR-011 notification email+in-app (Should), FR-013 reports+export (Should).
**Strategi:** Backend TDD dulu per modul, lalu frontend (mock + laravel + halaman), tutup dengan gate ganda.

> Skill: `writing-plans`, `test-driven-development`, `api-and-interface-design`, `verification-before-completion`.

## Prinsip

1. **Notifikasi sync** (tanpa worker): `Notification` biasa (tanpa `ShouldQueue`) channel `database` + `mail` (Mailpit di dev). Event: order created/ready/completed → owner+manajer tenant; pickup task dibuat → kurir yang ditugaskan (+ mail bila ≤24 jam sebagai "reminder" jujur tanpa scheduler).
2. **Kas bertutup harian:** `cash_closings` unik per outlet+tanggal; tanggal tertutup menolak entry (422, QA-04); owner/manajer boleh membuka kembali (delete closing tercatat audit).
3. **Bukti serah-terima:** upload foto opsional saat task selesai → disk `public` (dev), kolom `proof_path`. Tanpa MinIO di dev (YAGNI; disk configurable).
4. **Laporan tanpa dependensi baru:** agregat SQL + CSV via `fputcsv` stream.
5. **RBAC ikut matriks FRD:** task: kurir hanya assigned; kas: kasir create/read, operator/kurir 403; laporan: owner/manajer.

## Backend (TDD)

| Task | RED (test) | GREEN (implementasi) |
|---|---|---|
| R2.1 DeliveryTask | create+assign 201; kurir list hanya assigned; transisi status sah; driver lain 403; cross-tenant 404; proof upload menyimpan file | migration `delivery_tasks` (tenant/outlet/order/driver/type/scheduled_at/address/status/proof_path/notes), `DeliveryTaskStatus`+`DeliveryTaskType` enum, model+scope+policy, `DeliveryTaskController`, routes; upload via `store('proofs','public')` max 2MB image |
| R2.2 Cash | create income/expense 201; operator 403; summary harian benar; closing mengunci (create di tanggal tutup → 422, QA-04); reopen oleh owner OK + tercatat | migration `cash_entries` + `cash_closings`, `CashEntryType` enum, model+policy, `CashController` (index/create/summary/close/reopen), routes |
| R2.3 Notifikasi | order created/ready → notif DB untuk owner+manajer (+ mail ke mailpit, assert `Mail::fake`); task dibuat → notif kurir; list + mark-read; user lain tak bisa baca (403/404) | `OrderNotification`, `PickupTaskNotification` (toDatabase+toMail), trigger di Actions order/task, `NotificationController` (index/mine/unread-count/read), routes |
| R2.4 Laporan | summary agregat benar (revenue harian, per status, top service); CSV terdownload + isi valid; kasir 403 | `ReportController` (summary + sales.csv stream), routes |

Endpoints (`/api/v1`): CRUD-ish `delivery-tasks` (+`/{id}/status`, `/{id}/proof`), `cash-entries` (+`/summary`, `/close`, `/reopen`), `notifications` (+`/unread-count`, `/{id}/read`), `reports/summary`, `reports/sales.csv`.

## Frontend

- `ApiClient` + method baru (task/cash/notif/report) + implementasi **mock** (InMemoryStore extended) dan **laravel** (mappers) — halaman R2 nyata di kedua mode.
- Halaman: `/tasks` (tabel + dialog assign + aksi status kurir + upload bukti), `/cash` (summary harian + tabel + dialog entry + tutup/buka kas), `/reports` (filter tanggal + kartu + top service + tombol CSV), bell notifikasi di Topbar (count + dropdown + tandai dibaca).
- Verifikasi: skrip tsx sementara vs API live (26+ asersi baru), `tsc`/`eslint`/`build` hijau, skrip dihapus.

## Gate Akhir R2
Backend suite hijau + frontend gate hijau + catat audit di plan ini.

## Catatan Audit 2026-09-04 (pasca-R2)

- **Backend: 71 passed, 250 assertions** (R2.1 tasks 7, R2.2 cash 6, R2.3 notif 6, R2.4 reports 5, +users 3); `pint --test` PASS 126 files.
- **Frontend: 25/25 asersi R2 HIJAU** vs API live (tasks, cash+closing lock, notif, reports, CSV); `tsc`/`eslint`/`next build` hijau; skrip dihapus.
- **Temuan diperbaiki:** (1) `Sanctum::actingAs` bertahan antar-request dalam SATU test (guard memoization) — `setUp()` yang actingAs meracuni test guest berikutnya → pola baru: helper seed eksplisit, tanpa actingAs di setUp; (2) `Paginator::through()` tak hasilkan envelope `meta` → controller bangun manual via `setCollection`; (3) `fetchAll` frontend toleran dua bentuk pagination; (4) GD ditambahkan ke image (upload bukti + `fake()->image()`); (5) seeder dev + user kurir (`kurir@laundryos.test`).
- **Keputusan:** reminder pickup = notifikasi langsung bila ≤24 jam (tanpa scheduler); bukti foto di disk `public` dev; `cash_balance` dashboard R1 tetap Σ paid_amount (modul kas R2 kini sumber kebenaran harian per tanggal).

# Implementation Plan — Backend 100% Complete

**Tanggal:** 2026-09-04
**Basis:** FRD arsitektur (Redis queue), FR-011 penuh (reminder tepat waktu), NFR backup, skill `security-and-hardening` (threat model + audit checklist).
**Strategi:** TDD untuk perilaku baru; audit keamanan eksplisit per checklist skill.

> Skill: `writing-plans`, `test-driven-development`, `security-and-hardening`, `verification-before-completion`.

## Threat Model Ringkas (skill: threat model first)

| Boundary | Ancaman (STRIDE) | Mitigasi ada | Gap → task |
|---|---|---|---|
| `POST /v1/track` publik | Enumeration ticket+phone (I), brute force (D) | 404 generik, tanpa bocor | Throttle 10/mnt → B100-3 |
| `POST /v1/auth/login` | Credential stuffing (S) | bcrypt 12, 422 generik | Default throttle:api 60/mnt dipertahankan + dilaporkan (skill: ubah rate-limit perlu persetujuan — user diminta konfirmasi) |
| Upload bukti | File jahat (T) | image+2MB, disk public | Cukup untuk MVP |
| Notifikasi sync | Request lambat saat SMTP lag (D) | — | Queue redis + worker → B100-1 |
| Reminder pickup | Tak pernah tepat waktu tanpa scheduler | Teks "≤24 jam" saat create | Command + scheduler → B100-2 |
| DB pgsql | Hilang tanpa backup (D) | — | Skrip backup+restore → B100-5 |
| Secrets | Bocor ke git (I) | .env gitignored | Verifikasi sebelum commit → B100-4 |

## Task List

### B100-1 — Notifikasi via queue + worker (RED: test queue)
- Test: `Queue::fake()` + create order → `assertPushed(SendQueuedNotifications::class)`.
- GREEN: `ShouldQueue` (+`Queueable`) di `OrderNotification`, `PickupTaskNotification`; `QUEUE_CONNECTION=redis` di compose env api; service `worker` (`php artisan queue:work redis --sleep=3 --tries=3`).
- Verifikasi live: buat order via API → worker proses → mail di Mailpit + baris DB notification.
- **Verifikasi:** test hijau + bukti live.

### B100-2 — Reminder pickup terjadwal (RED: command test)
- Test: 3 task (due-assigned / jauh / done) → `artisan pickup:remind` hanya notif yang due (Notification::fake assertSentTo driver 1x) + flag terset; run kedua tidak kirim ganda.
- GREEN: migration `reminder_sent_at` nullable di delivery_tasks; `SendPickupReminders` command; schedule hourly di routes/console.php; service `scheduler` (`php artisan schedule:work`); reuse `PickupTaskNotification` (isUrgent otomatis true).
- **Verifikasi:** test hijau + `schedule:list` tampil.

### B100-3 — Throttle /track
- Test: 11 hit beruntun → respons ke-11 = 429.
- GREEN: `throttle:10,1` pada route track.
- **Verifikasi:** test hijau.

### B100-4 — Audit keamanan
- `composer audit` (triase per skill: reachable? fix tersedia?).
- Verifikasi: `.env` tidak terlacak git (nested .gitignore), tanpa secret di kode (`grep` password/secret/token di app/), semua route mutasi punya auth+policy (tambah `authorize viewAny` di OutletController + kasus 403 cashier — satu-satunya endpoint tanpa gate).
- Validasi: `scheduled_at` → `after:now` (jadwal masa lalu tak bermakna).
- Keputusan tercatat: token abilities = metadata (enforcement di policies); security headers & cookie httpOnly tetap pasca-MVP; login throttle default dipertahankan.
- **Verifikasi:** suite hijau + temuan/keputusan terdokumentasi di plan.

### B100-5 — Backup + API.md + gate
- `infra/backup.sh` (pg_dump via container pgsql → `infra/backups/`, gitignored) + `infra/restore.sh` + prosedur di README; uji restore sekali ke DB `laundry_restore` lalu hapus.
- `apps/api/API.md`: base URL, auth (login/token/abilities), konvensi (snake_case, pagination envelope, error shape), tabel endpoint + contoh curl, akun demo, batas (rate track, plan limits), catatan operasional (worker, scheduler, backup).
- Gate: suite penuh + pint + smoke live (login→order→notif via worker) + audit di plan ini.

## Batas
- Tanpa WAF/CDN, tanpa pen-test eksternal, tanpa enkripsi PII at-rest (di luar MVP).
- Tanpa refresh-token rotation (tetap pasca-MVP).

## Catatan Audit 2026-09-04 (pasca-B100)

- **Suite: 91 passed, 320 assertions; pint PASS 139 files.**
- **B100-1:** notifikasi `ShouldQueue` + worker redis + scheduler — terbukti live (order → worker → 2 mail Mailpit + baris DB). Insiden: (1) anak proses `php -S` tak warisi env → entrypoint sinkron `.env` (diperluas ke `QUEUE_CONNECTION`); (2) `up` pertama worker/scheduler crash race mount volume (recreate sembuh); (3) test menumpuk 192 job+mail di dev → phpunit `QUEUE_CONNECTION=sync` via `<server>`, dev redis bersih.
- **B100-2:** `pickup:remind` hourly + flag anti-ganda; reuse notifikasi task (urgent otomatis).
- **B100-3:** `/track` throttle 10/mnt + test 429.
- **B100-4:** composer audit + pnpm audit bersih; `.env` gitignored; semua endpoint bergate (tambah gate outlet + 403 kasir); `scheduled_at after:now`. Keputusan: token abilities = metadata; login throttle default; headers/CSP & httpOnly tetap pasca-MVP.
- **B100-5:** `infra/backup.sh`/`restore.sh` — restore teruji ke `laundry_restore` (6 users, 13 orders cocok) lalu DB di-drop; `apps/api/API.md` kontrak v1.
- Backend 100% complete untuk scope R0–R3 + operasional NFR dev.

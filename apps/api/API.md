# LaundryOS API — Kontrak v1

Base URL dev: `http://localhost:8000/api/v1`. Semua body/request JSON kecuali upload bukti (`multipart/form-data`).
Semua field memakai **snake_case**. Frontend memetakan ke camelCase di `LaravelApiClient`.

## Auth

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/auth/login` | — | SPA (Origin stateful) → set cookie sesi, balas `{user}`. Non-browser (tanpa Origin) → balas `{token, user}`. 422 bila salah |
| POST | `/auth/logout` | Sanctum | Revoke token aktif + hancurkan sesi |
| GET | `/auth/me` | Sanctum | `{user, tenant, outlets}` |

**Web SPA (cookie):** panggil `GET /sanctum/csrf-cookie` (credentials include) sebelum login/ubah data,
lalu kirim cookie sesi + header `X-XSRF-TOKEN`. CORS `supports_credentials=true`.
Domain yang dianggap stateful diatur `SANCTUM_STATEFUL_DOMAINS`.

**Mobile/API client (token):** `Authorization: Bearer <token>` dari respons login tanpa Origin.
Abilities token = `[role]` (metadata; enforcement di policies).
Throttle grup `api`: 60/menit per pengguna (atau per IP bila tamu). Login & `track` lebih ketat: 10/menit.

## Konvensi

- Error: `{ "message": string, "errors"?: object }`. Validasi → 422, tak ada akses → 403, tak ketemu lintas-tenant → 404.
- List: `?page=&q=` + filter per resource → envelope `{data, links, meta}` (`meta.current_page/last_page/total`).
- Enum status order: `received → washing → drying → ironing → ready → completed`, plus `cancelled` (hanya dari `received`).
- Ticket: `{KODE_OUTLET}-{YYYYMMDD}-{SEQ3}`, unik per tenant.

## Endpoint

| Method | Endpoint | Peran | Keterangan |
|---|---|---|---|
| GET | `/outlets` | owner, manajer | List outlet tenant |
| GET | `/outlets/{id}` | owner, manajer | Detail |
| POST | `/outlets` | owner | Cek limit paket |
| GET | `/users?role=` | owner, manajer | List staf tenant |
| POST | `/users` | owner | Invite + cek limit |
| GET/POST | `/customers` | owner, manajer, kasir | `q` cari nama/telepon |
| GET/PATCH | `/customers/{id}` | owner, manajer, kasir | Update parsial |
| GET/POST | `/services` | lihat: +kasir; ubah: owner/manajer | `unit` ∈ kg/pcs/pasang |
| GET/PATCH | `/services/{id}` | sama | Harga snapshot: order lama tak berubah |
| GET/POST | `/orders` | lihat: +operator; buat: +kasir | `status,q,outlet_id`; bayar diturunkan dari nominal |
| GET | `/orders/{id}` | +operator | + items & history |
| POST | `/orders/{id}/status` | owner, manajer, operator | Maju 1 tahap; terminal → 422 |
| POST | `/orders/{id}/cancel` | owner, manajer, kasir | Hanya dari received |
| GET/POST | `/delivery-tasks` | owner, manajer (+kurir: assigned) | Buat: owner/manajer |
| POST | `/delivery-tasks/{id}/status` | owner, manajer, kurir-pemilik | Satu tahap; terminal → 422 |
| POST | `/delivery-tasks/{id}/proof` | sama | `proof`: image ≤2MB → `proof_url` |
| GET/POST | `/cash-entries` | owner, manajer, kasir | `outlet_id,date`; tanggal tutup → 422 |
| GET | `/cash-entries/summary` | sama | `{income,expense,balance,closed}` |
| POST | `/cash-entries/close` | owner, manajer | Kunci tanggal |
| POST | `/cash-entries/reopen` | owner, manajer | Buka + audit |
| GET | `/notifications` | semua (milik sendiri) | Paginasi standar |
| GET | `/notifications/unread-count` | semua | `{unread}` |
| POST | `/notifications/{id}/read` | pemilik notif | Asing → 404 |
| GET | `/dashboard/summary` | owner, manajer | `?outlet_id=` |
| GET | `/reports/summary` | owner, manajer | `from,to,outlet_id` |
| GET | `/reports/sales.csv` | owner, manajer | Unduh CSV |
| GET/PATCH | `/subscription` | lihat: +manajer; ubah: owner | `{plan,limits,usage}` |
| POST | `/track` | **publik**, throttle 10/mnt | `{ticket, phone}` → data terbatas |

## Contoh

```bash
TOKEN=$(curl -s -X POST localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@laundryos.test","password":"password","device_name":"curl"}' | jq -r .token)

curl -s localhost:8000/api/v1/orders?status=ready -H "Authorization: Bearer $TOKEN" | jq .meta.total
```

## Akun demo (seed)

owner/kasir/operator/kurir `@laundryos.test` + `kasir.tbt@`, password `password`.

## Batas & operasional

- Langganan `past_due`/`cancelled` → tulis 403 (baca tetap 200); penagihan manual.
- Notifikasi via queue redis (`worker`), reminder pickup per jam (`scheduler`), mail ke Mailpit (`:8025`).
- Backup: `infra/backup.sh` / `restore.sh`. Plan limits: lihat `config/plans.php`.
- Produksi: set `APP_DEBUG=false`, `APP_URL` + `FRONTEND_URL` asli, `MAIL_*` provider nyata.

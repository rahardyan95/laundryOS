# Implementation Plan — Frontend Web Dashboard (Frontend-First)

**Tanggal:** 2026-09-04
**Basis:** BRD/PRD/FRD LaundryOS MVP + keputusan terkonfirmasi (monorepo, frontend dulu, email+in-app notif, billing manual)
**Strategi:** Frontend-first dengan **mock data layer** yang meniru kontrak API Laravel masa depan. Semua halaman berfungsi penuh terhadap mock store; penukaran ke API nyata cukup mengganti implementasi di satu modul.

> Skill yang mengatur eksekusi plan ini: `superpowers/writing-plans` (struktur), `ui-styling` (shadcn/ui + Tailwind), `antislop-ui` (aturan visual), `ponytail` (YAGNI).

---

## Prinsip Non-Negotiable

1. **UX PRD §8:** Mobile-first, 1 layar = 1 pekerjaan utama, status order selalu terlihat, default value sebanyak mungkin, minim modal berlapis.
2. **Antislop:** TANPA gradien biru-ungu generik, tanpa glassmorphism masif, tanpa metrik fiktif (angka dashboard berasal dari mock data nyata), empty state menyebut sebab + aksi lanjut, label "Rilis 2" eksplisit untuk stub.
3. **Kontrak API-shaped:** Nama fungsi + tipe mock = bentuk endpoint Laravel v1 yang akan dibangun (GET/POST /v1/orders, dst). Frontend TIDAK tahu data itu mock.
4. **Bahasa Indonesia** untuk seluruh UI (asumsi PRD §9).
5. **DRY/YAGNI:** Tidak ada state management library; TanStack Query ditunda sampai API nyata ada. Mock store = module functions + in-memory state.

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root: font, Toaster
│   │   ├── page.tsx                    # redirect → /login atau /dashboard
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          # login mock + pilih role demo
│   │   └── (dashboard)/
│   │       ├── layout.tsx              # SidebarProvider + AppSidebar + Topbar
│   │       ├── dashboard/page.tsx      # ringkasan owner (FR-012)
│   │       ├── orders/
│   │       │   ├── page.tsx            # tabel + filter status/pencarian
│   │       │   ├── new/page.tsx        # POS: entry order cepat (US-01)
│   │       │   └── [id]/page.tsx       # detail + timeline status + receipt (US-02)
│   │       ├── customers/page.tsx      # CRUD + history (FR-004)
│   │       ├── catalog/page.tsx        # service catalog (FR-005)
│   │       ├── tasks/page.tsx          # stub Rilis 2 — pickup/delivery (FR-009)
│   │       ├── cash/page.tsx           # stub Rilis 2 — kas (FR-010)
│   │       └── settings/page.tsx       # outlet & staff (FR-002/003, mock baca-saja MVP UI)
│   ├── lib/
│   │   ├── utils.ts                    # cn()
│   │   ├── api/                        # ← SATU-satunya pintu data
│   │   │   ├── types.ts                # Tenant, Outlet, User, Role, Customer, Service, OrderItem, Order, OrderStatus, CashEntry
│   │   │   ├── client.ts               # getOrders(), createOrder(), advanceStatus(), ... (delegasi ke mock)
│   │   │   └── mock/store.ts           # in-memory DB + seed Bahasa Indonesia
│   │   ├── order-machine.ts            # transisi status sah (FR-007) — sumber tunggal
│   │   └── format.ts                   # formatRupiah, formatTanggal, nomor ticket
│   └── components/
│       ├── ui/                         # shadcn/ui (CLI-generated)
│       ├── layout/                     # app-sidebar.tsx, topbar.tsx, outlet-switcher.tsx
│       ├── orders/                     # order-table.tsx, status-badge.tsx, order-form.tsx, status-timeline.tsx
│       └── shared/                     # empty-state.tsx, page-header.tsx
├── DESIGN.md                           # palet + keputusan desain (antislop R-01)
└── components.json
```

**State machine status (FR-007, sumber tunggal `order-machine.ts`):**
`Received → Washing → Drying → Ironing → Ready → Completed` — transisi hanya maju satu tahap; `Cancelled` hanya dari `Received`. Dipakai bersama oleh UI (disable tombol) dan mock store (tolak invalid → QA-02).

---

## Task List

### T1 — Bootstrap monorepo
- `pnpm-workspace.yaml` (packages: apps/*), root `.gitignore`, `README.md` singkat.
- `git init` + commit pertama.
- **Verifikasi:** `git log --oneline` menunjukkan commit awal; `pnpm -v` OK.

### T2 — Scaffold Next.js
- `pnpm create next-app@latest apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --turbopack` (disable git di dalam).
- **Verifikasi:** `pnpm --filter web build` sukses.

### T3 — shadcn/ui + komponen inti
- `npx shadcn@latest init` (css variables, base color neutral).
- Add: `button card input label textarea select badge table dialog dropdown-menu separator tabs avatar sonner sheet sidebar skeleton progress`.
- **Verifikasi:** build sukses; folder `src/components/ui` terisi.

### T4 — DESIGN.md + design tokens
- Palet identitas "laundry bersih": primary **teal gelap** (teal-700) — segar tapi bukan default-blue; accent **amber** untuk status perlu-aksi; permukaan putih hangat (stone). Ditulis di DESIGN.md beserta alasannya (R-01).
- Override CSS variables di `globals.css` (light mode default; dark mode tidak dikirim di MVP frontend).
- **Verifikasi:** build sukses; satu halaman contoh memakai token.

### T5+T6 — Kontrak API (types) + mock data + store
- `types.ts`: semua entitas FRD §4 (field mengikuti FRD, `tenantId/outletId` ada di semua model transaksional — refleksi global scope backend).
- `mock/store.ts`: seed 1 tenant, 2 outlet, 5 user (1 per role), ~8 customer, 5 service, ~12 order tersebar antar status + riwayat status bertimestamp.
- `client.ts`: fungsi async API-shaped: `login()`, `getMe()`, `getDashboardSummary()`, `listOrders(filter)`, `getOrder(id)`, `createOrder(input)`, `advanceOrderStatus(id)`, `cancelOrder(id)`, `listCustomers()`, `upsertCustomer()`, `listServices()`, `upsertService()`.
- Delay artifisial kecil (150–300ms) agar state loading/error teruji jujur.
- **Verifikasi:** `tsc --noEmit` sukses; transisi invalid ditolak (unit sederhana di `order-machine.ts`).

### T7 — Login
- Halaman login: email + password + demo role chips (Owner/Kasir/Operator) — jelasnya mock login.
- Menyimpan session mock di `sessionStorage` (helper `lib/api/session.ts`).
- **Verifikasi:** login Owner → redirect `/dashboard`.

### T8 — Layout dashboard role-based
- `AppSidebar` (shadcn sidebar): item difilter per role sesuai matriks FRD §2 (Owner semua; Kasir: Orders/Customers/Catalog; Operator: Orders read; stub Tasks/Cash hanya Owner).
- Topbar: outlet switcher (Owner/Manager), nama user + role badge, logout.
- Mobile: sidebar jadi `Sheet` (shadcn sidebar sudah handle).
- **Verifikasi:** navigasi keyboard OK; mobile breakpoint OK.

### T9 — Dashboard owner (FR-012)
- Kartu: Order hari ini, Omzet hari ini, Piutang (unpaid), Kas saldo, Beban kerja (order per status) — semua dihitung dari mock store, bukan angka karangan.
- Daftar "Perlu perhatian": order Ready belum diambil > X jam (data mock).
- **Verifikasi:** angka konsisten dengan data di halaman orders.

### T10 — Orders list
- Tabel: ticket, customer, layanan, total, status badge, payment badge, dibuat.
- Filter status (Select), pencarian nama/ticket, tab per status? (YAGNI: Select cukup).
- Empty state: "Belum ada order dengan filter ini — Buat order baru".
- **Verifikasi:** filter bekerja terhadap mock store.

### T11 — POS Order baru (US-01, layar terpenting kasir)
- 1 kolom utama: pilih customer (command palette inline + buat baru inline: nama+telepon saja), tambah layanan (qty/berat, unit dari service), catatan, opsi antar-jemput (informasional di MVP), metode pembayaran + status bayar (default DP/belum), total otomatis besar + jelas.
- Submit → `createOrder` → nomor ticket otomatis `OUT-{yyyymmdd}-{seq}` → redirect ke detail order.
- Keyboard-first: enter pada pencarian memilih item pertama.
- **Verifikasi:** order baru muncul di list dengan status Received; ticket unik.

### T12 — Order detail + status timeline (US-02)
- Header: ticket + status badge + customer + total + payment.
- Timeline riwayat status (timestamp dari mock).
- Tombol transisi tunggal "Lanjut ke {tahap berikutnya}" — disabled bila tidak sah; alasan kenapa disabled ditampilkan (title/aria).
- Tombol "Cetak struk" → window.print dengan layout struk sederhana (stub PDF R2).
- **Verifikasi:** klik lanjut memperbarui timeline; refresh mempertahankan state (mock store in-memory per sesi).

### T13 — Customers
- Tabel: nama, telepon, jumlah order, order terakhir. Dialog create/edit (nama, telepon, alamat). Row expand → history order.
- **Verifikasi:** create customer → bisa langsung dipakai di POS.

### T14 — Catalog
- Tabel layanan: nama, unit (kg/pcs/pasang), harga, estimasi jam. Dialog create/edit.
- **Verifikasi:** layanan baru muncul di POS.

### T15 — Stub Tasks/Cash/Settings
- Tasks: header + empty-state jujur "Modul pickup/delivery masuk Rilis 2 — antrean task akan aktif setelah modul operasional" (R-24 compliant).
- Cash: "Rilis 2". Settings: baca-saja outlet & staff dari mock.
- **Verifikasi:** tidak ada tombol mati tanpa label.

### T16 — QA Gate
- `pnpm --filter web lint`, `tsc --noEmit`, `build` — semua hijau.
- Ceklis antislop-ui §UI Skill Checklist: palet non-default, dose cap efek, layout dibangun dari keputusan user, data jujur, empty/loading/error beralasan, keyboard + breakpoint.
- Commit per task, pesan konvensional (`feat(web): ...`).

---

## Batas & Tunda (YAGNI)
- Tanpa TanStack Query, Zustand, chart library — masuk saat integrasi API nyata.
- Tanpa dark mode, i18n, PWA.
- Autentikasi = mock session; kontrak `login()/getMe()` sudah API-shaped agar Sanctum cookie ditambahkan tanpa refactor UI.

## Handoff Eksekusi
Eksekusi inline di sesi ini (batch per task + checkpoint commit). Setelah T16, frontend siap jadi target kontrak untuk backend Laravel (plan terpisah: `2026-09-XX-api-laravel-core.md`).

## Catatan Audit 2026-09-04 (pasca-T16)

- **Bug kritis diperbaiki:** `InMemoryStore` membuat semua seed order dengan id & ticket duplikat (array literal dievaluasi sebelum assignment). Diperbaiki via `normalizeSeedIdentities()` + skrip verifikasi 8 asersi (unik + transisi sah/ditolak + ringkasan konsisten) — hijau; siklus red-green terbukti (tanpa fix: 4 FAIL).
- **Belum dikerjakan (di luar scope plan ini, tercatat untuk plan berikut):** test suite frontend, portal customer (US-06), laporan/export (FR-013), invite staff UI (FR-003), layout struk cetak (saat ini window.print halaman), notification center in-app (FR-011), verifikasi E2E di browser.
- Commit ditunda atas permintaan user — seluruh tree masih uncommitted.

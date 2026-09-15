# Ringkasan Requirement LaundryOS MVP

> Diekstrak dari `BRD_LaundryOS_MVP.docx`, `PRD_LaundryOS_MVP.docx`, `FRD_LaundryOS_MVP.docx`
> (dokumen asli dipindah ke `docs/archive/` — biner tidak diffable).
> Sumber berlaku: kontrak API `apps/api/API.md`, status verifikasi `docs/CHECKPOINT.md`.

## 1. BRD — Alasan bisnis

**Tujuan:** digitalisasi order → selesai, lepas dari buku/chat/spreadsheet; visibilitas owner atas order/pelanggan/kas; fondasi SaaS subscription per outlet yang bisa dipakai ulang untuk vertikal UMKM lain.

**Value → indikator:** operasional rapi → order exception rate; CX konsisten → complaint/inquiry rate; kontrol owner → dashboard adoption; outlet baru tanpa sistem baru → time-to-onboard; recurring revenue → MRR/retention.

**As-Is → To-Be:** order buku/chat → ticket digital; status informal → workflow + timestamp; kontak tersebar → customer master + history; pickup via chat → task & schedule; kas catatan harian → income/expense + closing; rekap manual → dashboard real-time/near real-time.

| ID | Requirement | Prioritas | Acceptance |
|---|---|---|---|
| BR-01 | Akun owner + staff dengan akses per role | Must | Role dapat dibatasi dan diuji |
| BR-02 | Outlet sebagai unit operasional | Must | Transaksi terisolasi per outlet |
| BR-03 | Order punya lifecycle status | Must | Tanpa status bebas tanpa audit |
| BR-04 | Owner lihat ringkasan transaksi + kas | Must | Dashboard metric inti |
| BR-05 | Pickup/delivery terjadwal | Should | Task dapat dibuat/diselesaikan |
| BR-06 | Subscription dibedakan per outlet/plan | Should | Plan limit ditegakkan |
| BR-07 | Dapat diperluas ke vertikal UMKM lain | Must | Core module reusable/configurable |

**Revenue:** subscription per outlet; tier potensial Starter/Growth/Multi-Outlet (limit outlet, staff, transaksi + add-on delivery, WA notif, storage, reporting, loyalty). Pricing final butuh interview willingness-to-pay.

**GTM:** mulai kiloan/satuan (workflow jelas, mudah didemo) → validasi di beberapa bisnis nyata → landing ringan untuk SEO/lead → repackage core untuk cafe/restoran/retail.

**Risiko → mitigasi:** enggan migrasi → import CSV + assisted onboarding; terlalu kompleks → modular UI + role menu + progressive disclosure; churn → activation metrics + support; notifikasi gagal → retry queue + fallback + delivery log; scope creep → MVP gate + change control.

**Acceptance bisnis:** operasional harian tanpa spreadsheet untuk proses inti; semua order punya history/status teraudit; owner lihat order + kas satu dashboard; satu tenant bisa multi-outlet pada tier yang mendukung.

## 2. PRD — Produk

**Visi:** satu aplikasi sederhana untuk transaksi masuk, status pekerjaan, pelanggan, pickup/delivery, kas, notifikasi.

**Problem:** order/status manual → customer sulit dapat update konsisten; data pelanggan tidak terpusat; pickup sulit dijadwal/monitor; kas tidak terhubung transaksi; owner rekap dari banyak catatan.

| Persona | Tujuan | Pain | Kebutuhan utama |
|---|---|---|---|
| Owner | Kontrol usaha + omzet | Laporan tersebar | Dashboard, kas, laporan, multi-outlet |
| Kasir/Admin | Terima + proses order | Input manual berulang | Order cepat, pelanggan, status, bayar |
| Operator | Kerjakan cucian | Status tidak jelas | Work queue, status tahap, catatan |
| Kurir | Tepat waktu | Jadwal/alamat berantakan | Task, alamat, status, proof of delivery |
| Customer | Tahu status | Harus chat/call | Receipt, status, notifikasi |

**Scope MVP → pasca-MVP:** order create/edit/ticket/status/total/payment → recurring/loyalty; customer profile/history → segmentasi/kampanye; workflow `Received > Washing > Drying > Ironing > Ready > Completed` → custom per service; pickup schedule/driver/status/proof → route optimization/live tracking; kas income/expense/closing → bank sync/akuntansi; notifikasi status + pickup reminder → marketing automation; report sales/order/outstanding/cash → forecasting/benchmark.

| ID | Story |
|---|---|
| US-01 | Kasir buat order baru → tercatat cepat |
| US-02 | Kasir ubah status → customer dapat progress benar |
| US-03 | Owner lihat omzet + kas harian → tahu performa |
| US-04 | Operator lihat antrean → tahu yang diproses |
| US-05 | Kurir lihat pickup/delivery → teratur |
| US-06 | Customer lihat status → tanpa tanya progres |
| US-07 | Owner kelola outlet + staff → akses sesuai tanggung jawab |

**Success metric:** completion >95%; data completeness >98% (customer+service+amount+status); owner weekly active >50%; input order <90 dtk; failed notification <2%.

**Release:** R0 foundation (auth, tenant/outlet, role, DB, audit, design system) → R1 core laundry (customer, service, order, payment, workflow, receipt) → R2 operations (pickup, notif, kas, dashboard, report) → R3 SaaS (subscription, limit, multi-outlet, billing, usage) → R4 expansion (modul reusable cafe/restoran/retail/jasa).

**Prinsip UX:** mobile-first untuk staff; 1 layar = 1 pekerjaan; status selalu terlihat konsisten; default value untuk input kasir cepat; report jawab: order, omzet, piutang, kas, pekerjaan tertunda.

**Asumsi/belum MVP:** harga belum ditetapkan; payment gateway, WA provider, printer thermal, marketplace bukan MVP; pajak/akuntansi formal belum — MVP hanya kas operasional; single country/currency, Bahasa Indonesia.

## 3. FRD — Fungsional

**Arsitektur anjuran:** Astro (landing/SEO) + Next.js+TS (dashboard/POS/portal) + Laravel 13 (API/bisnis/auth/jobs/notif) + Flutter (owner/staff/driver) + PostgreSQL + Redis (queue/cache/rate-limit) + S3-compatible (receipt/foto) + Docker+CI/CD. Mulai modular monolith, bukan microservices.

**Role:** Owner full CRUD + full report/setting; Manager CRUD customer/order, read/limited cash, outlet limited; Cashier CRU customer, CRUD order, create/read cash, basic report; Operator read customer + update status saja; Driver read assigned + pickup/delivery saja.

| ID | Modul | Requirement | Prioritas |
|---|---|---|---|
| FR-001 | Auth | Login/logout/reset | Must |
| FR-002 | Tenant & Outlet | Owner buat tenant/outlet; transaksi terikat outlet | Must |
| FR-003 | User | Invite staff + assign role | Must |
| FR-004 | Customer | CRUD + alamat + history | Must |
| FR-005 | Service | Service, unit, harga, estimasi, add-on | Must |
| FR-006 | Order | Customer+service+qty/berat+notes+pickup/delivery+payment | Must |
| FR-007 | Status | Workflow default + tercatat | Must |
| FR-008 | Ticket | Nomor unik + receipt cetak/PDF | Must |
| FR-009 | Pickup/Delivery | Task + jadwal + driver + alamat + status + proof | Should |
| FR-010 | Cash | Income/expense + method + closing | Must |
| FR-011 | Notification | Trigger created/ready/pickup-reminder/completed | Should |
| FR-012 | Dashboard | Today/sales/outstanding/cash/workload | Must |
| FR-013 | Report | Filter tanggal/outlet/status + export CSV/PDF | Should |
| FR-014 | Audit | User/order/payment/setting tercatat | Must |
| FR-015 | Subscription | Tegakkan plan/outlet-limit/user-limit/status | Should |

**Model data:** Tenant(1:N outlets/users) → Outlet(1:N orders/users) → Customer(1:N orders), Service(1:N items), Order(1:N items/history) + OrderStatusHistory(from/to/by/ts) + DeliveryTask(order/driver/type/schedule/status/proof) + CashEntry(outlet/type/category/amount/ref) + NotificationLog(channel/template/status) + Subscription(tenant/plan/status/period/limit).

**Contoh kontrak API:** `POST /api/v1/auth/login`, `GET|POST /api/v1/customers`, `POST /api/v1/orders`, `GET /api/v1/orders/{id}`, `POST /api/v1/orders/{id}/status`, `POST /api/v1/orders/{id}/delivery`, `POST /api/v1/cash-entries`, `GET /api/v1/dashboard/summary`.

**Business rules:** kode order unik per tenant (human-readable outlet/date/sequence); transisi status hanya via transition valid; harga di-snapshot di order item; isolasi tenant di query/API/cache/storage/export; closing kas terkunci (adjustment privileged); aksi kritis ada actor + timestamp.

**NFR:** p95 API sederhana <500 ms; uptime awal 99.5%; isolasi tenant + least privilege + audit + rate limit; backup harian + uji restore; structured log + error tracking + uptime monitor; keyboard/label/kontras/responsif; query/index siap horizontal scale stateless.

| ID | Skenario QA | Harapan |
|---|---|---|
| QA-01 | Create order valid | Total terhitung, status Received |
| QA-02 | Transisi invalid | Ditolak, status lama bertahan |
| QA-03 | Akses lintas tenant | 403/404, data tak bocor |
| QA-04 | Daily closing | Terkunci + jalur adjustment |
| QA-05 | Notifikasi gagal | Antre + retry sesuai policy |
| QA-06 | Batasan role | Operator tak bisa edit kas/subscription |
| QA-07 | Export | Hormati scope outlet/tanggal/tenant |

# LaundryOS Web — Keputusan Desain v2 ("Pine & Lime")

> Sumber kebenaran palet & pola UI. Mengikuti aturan `antislop-ui`.
> v2 (2026-09-04): remake total dari "clean linen" teal — lebih modern, minimalis, beridentitas.

## 1. Identitas — "Air pinus dalam, jeruk nipis segar"

Keputusan (R-01, ada alasan tertulis, bukan default model):

| Token | Nilai | Alasan |
|---|---|---|
| `--primary` pinus | `oklch(0.38 0.065 168)` (#0C3B36) | Hijau pinus gelap: air bersih + dedaunan, membedakan dari biru default SaaS generik. Dipakai CTA utama, badge Ready, logo. |
| `--accent` limau | `oklch(0.91 0.185 128)` (#BEF264) | Satu momen aksen: indikator aktif sidebar, titik timeline, highlight. Tidak dipakai untuk teks body (kontras). |
| `--background` kertas | `oklch(0.984 0.004 95)` | Putih hangat — bersih seperti linen, bukan putih biru dingin. |
| `--foreground` tinta | `oklch(0.22 0.012 90)` | Hampir-hitam hangat, kontras > 12:1 di atas kertas. |
| Sidebar | Pinus solid + teks putih | Keputusan berani: navigasi gelap, konten terang. Active item = pil limau + teks pinus. |
| `--radius` | `0.75rem` | Lebih lembut dan modern dari 0.625rem. |

### Dilarang (tetap)
Gradien biru→ungu generik, glassmorphism, glow/neon, dark-mode default, emoji dekoratif, bento-grid, stripe kiri tanpa makna.

## 2. Tipografi — Plus Jakarta Sans

Dipilih dari database ui-ux-pro-max ("Enterprise SaaS Mobile", single-family geometric sans, dirancang desainer Indonesia — cocok untuk SaaS UMKM Indonesia).

| Peran | Setting |
|---|---|
| UI + heading | Plus Jakarta Sans 400/500/600/700/800 via `next/font` |
| Judul halaman | 700–800, `tracking-tight` |
| Angka nominal | `font-mono tabular-nums` (Geist Mono dipertahankan — pasangan netral) |
| Label kecil | 500, uppercase TIDAK dipakai (hindari teriakan) |

## 3. Logo

Mark geometris: squircle pinus berisi tetesan limau dengan potongan gelombang (air + kesegaran). Komponen `Logo` (SVG inline, prop `size`): dipakai sidebar, login, halaman publik. Tanpa ikon generik Lucide sebagai logo.

## 4. Motion — restrained (MOTION ~2)

- `fade-rise` 220ms sekali saat konten utama mount; kartu dashboard stagger 60ms via `--i`.
- Hover lift hanya pada elemen klik (kartu non-klik diam).
- `active:scale-[0.98]` pada tombol.
- `prefers-reduced-motion`: semua animasi mati.
- Tanpa loop, tanpa parallax, tanpa scroll-trigger.

## 5. Semantik Status (dipertahankan, diselaraskan)

Received stone · Washing sky · Drying amber · Ironing plum · **Ready pinus solid** · Completed emerald · Cancelled red.
Pembayaran: Lunas emerald / DP amber / Belum red (outline). Warna hanya di badge/titik.

## 6. Layout (C-3 — dari keputusan user, bukan template)

- Kasir: 1 kolom entry order. Owner: 5 jawaban bisnis. Operator: antrean. Kurir: task.
- Sidebar gelap ramping: logo → grup Ringkasan/Operasional/Keuangan/Kelola → kartu user.
- Topbar terang minimal: trigger, outlet, bell, avatar, keluar.
- 1 layar = 1 pekerjaan; minim modal berlapis.

## 7. Data jujur & aksesibilitas

Sama seperti v1: angka dari data, empty state bersebab+aksi, placeholder jujur, label Rilis 2 eksplisit.
Keyboard-first POS dipertahankan; semua kontrol berlabel (a11y); kontras teks ≥ 4.5:1.

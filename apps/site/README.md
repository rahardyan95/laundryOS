# LaundryOS — Marketing Site (Astro)

Situs statis untuk SEO/lead capture: landing, harga, dan FAQ. Terpisah dari aplikasi
(`apps/web`) yang menangani dashboard/POS.

## Menjalankan

```bash
pnpm install                 # dari root workspace
pnpm --filter site dev       # http://localhost:4321
pnpm --filter site build     # hasil statis di apps/site/dist
pnpm --filter site preview
pnpm --filter site exec astro check
```

## Konfigurasi

- `PUBLIC_SITE_URL` — domain publik situs; dipakai untuk canonical, `sitemap.xml`
  (`sitemap-index.xml` + `sitemap-0.xml` dari `@astrojs/sitemap`), dan `robots.txt`
  (digenerate dari endpoint `src/pages/robots.txt.ts`, bukan berkas statis).
- `PUBLIC_APP_URL` — URL aplikasi (dashboard) untuk CTA "Masuk"/"Lacak cucian"
  (`src/config.ts`). Di produksi wajib diisi; `Dockerfile.prod` menolak build tanpa
  `PUBLIC_SITE_URL` + `PUBLIC_APP_URL` sehingga HTML produksi tidak memuat tautan localhost.

Tanpa env (dev lokal / CI), `site` jatuh ke `http://localhost:4321`.

## Halaman

- `/` — landing: hero, fitur, alur, peran, FAQ, CTA.
- `/harga` — paket Starter/Growth/Multi-Outlet.
- `/404` — halaman tidak ditemukan (dipakai juga sebagai `error_page 404` di `nginx.conf`).
- `/robots.txt`, `/sitemap-index.xml` — hasil generate saat build.

## Deploy

- **VPS (cara resmi):** service `site` di `infra/docker-compose.prod.yml` membangun
  `apps/site/Dockerfile.prod` (node → build statis → `nginx:1.27-alpine`) dan dilayani edge
  nginx pada host publik (`server_name` di `infra/nginx/laundryos.conf`). Lihat `infra/DEPLOY.md` §3/§5.
- Hosting statis (Netlify/Cloudflare Pages): arahkan ke `apps/site/dist`, set `PUBLIC_*` saat build.

`Dockerfile.prod` memakai lockfile mandiri di folder ini (`pnpm-lock.yaml` + `pnpm-workspace.yaml`,
sama pola dengan `apps/web`) supaya konteks build berdiri sendiri; setelah menambah dependensi di
root, jalankan `pnpm install --lockfile-only` dari `apps/site` agar lockfile itu ikut diperbarui.

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

- `PUBLIC_SITE_URL` — domain publik (untuk canonical/sitemap).
- `PUBLIC_APP_URL` — URL aplikasi (default `http://localhost:3000`) untuk CTA "Masuk".

## Halaman

- `/` — landing: hero, fitur, alur, peran, FAQ, CTA.
- `/harga` — paket Starter/Growth/Multi-Outlet.
- `/404` — halaman tidak ditemukan.

## Deploy

Hasil build statis (`dist/`) dapat dilayani Nginx di VPS yang sama (root `/var/www/site`)
atau di-hosting statis (Netlify/Cloudflare Pages). Set konfigurasi `PUBLIC_*` saat build.

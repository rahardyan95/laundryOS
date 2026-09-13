# Security Policy — LaundryOS

## Versi yang didukung

Hanya branch `master`/`main` terbaru yang menerima patch keamanan.

## Melaporkan kerentanan

Jangan buka issue publik untuk masalah keamanan. Kirim laporan privat ke
**security@laundryos.example** berisi:

- deskripsi dan dampak,
- langkah reproduksi (PoC),
- versi/commit yang terpengaruh,
- saran remediasi bila ada.

Kami berupaya membalas dalam 3 hari kerja dan memberi tahu jadwal perbaikan.

## Praktik keamanan proyek

- Otentikasi web via cookie httpOnly Sanctum SPA + CSRF; token bearer untuk mobile.
- Isolasi tenant lewat global scope; policy per resource.
- Rate limit API 60/menit, login/track 10/menit.
- Scanning otomatis: gitleaks, Trivy, `composer audit`, `pnpm audit`, Dependabot.
- Rahasia tidak pernah di-commit (`.env` diabaikan); produksi wajib HTTPS.

## Cakupan di luar

WAF/CDN dan pen-test eksternal manusia direncanakan pasca-rilis (lihat
`docs/superpowers/plans/2026-09-13-production-100.md`).

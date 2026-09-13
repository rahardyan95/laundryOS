# Implementation Plan — Security Testing (Threat Indications)

**Tanggal:** 2026-09-04
**Basis:** Skill `owasp-top-10-testing` + `api-security-testing` (cakupan jujur per kategori), `sast-scanning` (Semgrep), `container-scanning` (Trivy), `security-and-hardening` (checklist), `test-driven-development`.
**Batasan jujur:** Strix autonomous (butuh LLM key eksternal) dan ZAP full tidak dijalankan — diganti Semgrep + Trivy + abuse-case tests + probe DAST manual yang dapat diverifikasi di environment ini. A09 (logging pipeline) dinilai via review kode, bukan runtime.

> Cakupan per OWASP API Top 10: API1 BOLA ✅ (suite), API2 auth ✅, API3 mass-assignment/exposure (tambah test), API4 konsumsi tak terbatas (tambah cap + test), API5 function-authz ✅, API6 inventory (tambah API.md? sudah ada), API7 SSRF (N/A — verifikasi grep), API8 auth flaws (probe throttle), API9 improper inventory (API.md ✅), API10 unsafe consumption (validasi ✅).

## Task List

### S1 — SAST Semgrep (tool)
- `docker run --rm -v <root>:/src semgrep/semgrep semgrep --config auto --json apps/api apps/web/src` → triase temuan (reachable? true/false positive?).
- Perbaiki temuan valid; catat false positive beralasan.
- **Verifikasi:** run ulang bersih/kritis nol.

### S2 — Abuse-case tests backend (TDD)
- Mass assignment: POST order dengan `status/completed + ticket + total + tenant_id` asing → diabaikan (tetap received, ticket server-side, total server-side).
- Evil upload: `.php` sebagai proof → 422; (batas 2MB sudah ada).
- SQLi: `q=' OR '1'='1` di customers/orders → 200, 0 baris, tanpa error.
- API4: `per_page=500` → di-cap 100 (implementasi clamp helper + test).
- Exposure: user resource tanpa password/remember_token; order tanpa data sensitif lain (assert struktur).
- **Verifikasi:** suite hijau.

### S3 — Trivy container scan (tool)
- `trivy image infra-api` (+ postgres:16-alpine ringan? hanya image kita).
- Triase CRITICAL/HIGH reachable; putuskan fix vs dokumentasi.
- **Verifikasi:** laporan tersimpan.

### S4 — Probe DAST live (skrip sementara, hapus setelahnya)
- CORS origin jahat → tanpa ACAO; security headers dump (dokumentasi); login throttle 61x → 429 hadir; body raksasa → 413/422; method salah → 405; token sampah → 401; XSS tersimpan → render aman (React escape, cek via E2E? cukup kode+unit: assert stored raw, catat encoding di frontend).
- **Verifikasi:** semua probe sesuai ekspektasi.

### S5 — Remediasi + laporan + gate
- Perbaiki temuan valid; suite + pint; simpan `docs/security/REPORT-2026-09-04.md` (temuan per OWASP, PoC, status); audit di plan ini.

## Batas
- Tanpa Strix/ZAP eksternal (butuh kunci/biaya); tanpa pen-test manusia; tanpa enkripsi at-rest (tetap pasca-MVP).

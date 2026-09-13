# LaundryOS — Agent Rules

Aturan proyek yang wajib dipatuhi saat menulis atau mengubah kode.

## R1 — Object-Oriented Programming (OOP)

Semua kode **wajib OOP**: gunakan class/objek dengan tanggung jawab tunggal, enkapsulasi
state, method publik sebagai kontrak, dan hindari fungsi prosedural yang menggantung.

- **Backend (PHP/Laravel):** sudah OOP — Domain class, Action, Policy, Resource, Enum,
  Service. Jangan tambahkan fungsi global baru; bungkus dalam class.
- **Logic/data layer frontend (TypeScript):** gunakan `class` atau objek namespace
  (mis. `SessionManager`, `LaravelApiClient`, `OrderMachine`, `NavPolicy`, `Format`).
  Logika bisnis tidak boleh ditulis sebagai fungsi bebas di dalam file komponen.
- **UI layer (React/Next):** function component + hooks **tetap diizinkan** — itu
  konvensi wajib React 19/Next 16; logika non-UI dipindah ke class di `src/lib/`.
- Hindari: util fungsi lepas yang menumpuk state, `any` untuk menutupi desain,
  dan duplikasi logika antar mode.

## R2 — Verifikasi sebelum selesai

Setiap perubahan harus lolos: `tsc`, `eslint`, `vitest`, `next build`, `php artisan test`,
`pint --test`, dan Playwright E2E (bila menyentuh UI).

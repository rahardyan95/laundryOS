# LaundryOS — Agent Rules

Aturan proyek yang wajib dipatuhi saat menulis atau mengubah kode.
Berlaku untuk SEMUA kode di repo ini: `apps/api` (PHP/Laravel), `apps/web`
(TypeScript/React/Next.js), `apps/mobile` (Dart/Flutter), `apps/site` (Astro),
`infra/` (skrip shell/compose), dan `docs/` bila menyentuh contoh kode.
Tidak ada pengecualian: skrip, test, seed, migrasi, dan contoh dokumentasi
mengikuti aturan yang sama.

## R0 — Definisi Selesai (wajib sebelum klaim selesai)

Perubahan dianggap selesai bila SEMUA terpenuhi:

1. Tidak ada penanda utang baru (`TODO`, `FIXME`, `HACK`, `NotImplemented`,
   halaman kosong, stub tanpa issue tercatat).
2. Lolos gerbang verifikasi R2 untuk area yang disentuh.
3. Bukti perilaku dilampirkan (R2): bukan hanya test hijau.
4. `docs/CHECKPOINT.md` dan `docs/CARA-MENJALANKAN.md` dimutakhirkan bila
   perilaku, perintah, atau angka test berubah.

## R1 — Object-Oriented Programming (OOP)

Semua kode **wajib OOP**: kelas dengan tanggung jawab tunggal, state terenkapsulasi, method publik
sebagai kontrak, tanpa fungsi prosedural yang menggantung.

**1.1 Satu kelas, satu tanggung jawab, satu file.** Satu file berisi satu kelas publik; kelas bantu
internal ditulis `_Private` di file yang sama. Tidak ada berkas "utils" berisi kumpulan fungsi lepas.

**1.2 Logika bisnis tidak boleh tinggal di lapisan tampilan.** Aturan status, perhitungan, dan
pemetaan data ada di kelas (`domain/`, `state/`, `repositories/`, `api/` di mobile; `src/lib/` di web).
Widget/komponen hanya merender.

**1.3 `domain/` bebas kerangka UI.** Di mobile, `lib/src/domain/` hanya boleh mengimpor Dart murni dan
`package:intl` (mis. `StatusKind`, `OrderMachine`, `Format`) supaya aturannya bisa diuji tanpa Flutter.
Ketergantungan ke Flutter mengarah satu arah: `screens`/`widgets` → `state` → `repositories` → `api`.

**1.4 Nilai visual hanya dari token.** Warna, radius, jarak, dan durasi diambil dari `lib/src/theme/`
(`AppPalette`, `AppSpacing`, `AppRadii`, `AppMotion`, `AppTypography`). Literal seperti `Color(0xFF...)`,
`EdgeInsets.all(13)`, atau `Duration(milliseconds: 250)` **dilarang** di layar dan widget.

**1.5 Warna status lewat makna, bukan hex.** Domain menentukan arti (`StatusKind`: netral, info,
peringatan, perhatian, positif, negatif, merek); tema menentukan warnanya (`StatusTones`). Widget memakai
`StatusChip` dan `StatusTones.of(context).tone(kind)`.

**1.6 Keadaan data lewat satu jalur.** Layar yang menampilkan data asinkron memakai `AsyncSection`
(memuat, kosong, galat, isi) dan `EmptyState` yang menyebut sebab + langkah berikutnya. Tidak ada lagi
rantai `if (loading) … else if (kosong) …` yang ditulis ulang per layar.

**1.7 State di `ChangeNotifier`, bukan di widget.** Controller memegang `loading`, `error`, dan data.
Widget state hanya untuk hal milik UI (posisi scroll, isi field, tab aktif). Dependency dirangkai di
`AppDependencies` supaya bisa diuji dengan transport/session store palsu.

**1.8 Frontend web (TypeScript).** `class` atau objek namespace untuk logika (`SessionManager`,
`LaravelApiClient`, `TaskMachine`, `PaymentPolicy`, `NavPolicy`, `Format`) di `src/lib/`. Function
component + hooks tetap dipakai untuk UI karena itu konvensi React 19/Next 16 — logika non-UI-nya
dipindah ke kelas.

**1.9 Backend (PHP/Laravel).** Domain class, Action, Policy, Resource, Enum, Service. Tidak menambah
fungsi global baru; bungkus dalam kelas.

**1.10 Anti-prosedural (semua bahasa).** Dilarang menambah fungsi/konstanta lepas di luar kelas
(`export function`/`export const` di `src/lib/`, fungsi top-level Dart di `lib/src/`,
`function foo()` global PHP, skrip Astro yang berisi logika bisnis). Pengecualian: function component
React dan hook UI (kontraknya JSX — isinya hanya render + delegasi ke kelas), entrypoint/wiring
(`main.dart`, `layout.tsx`, route handler yang hanya memanggil Action), dan test/fixture/E2E helper
yang dibungkus `class ...Test`/`class E2e*`. Konstanta konfigurasi tinggal di kelas pemiliknya
(`static readonly`), bukan di file lepas.

**1.11 Gerbang OOP per bahasa (cek sebelum commit).**

| Area | Perintah gerbang | Lolos bila |
|---|---|---|
| Web `src/lib/` | `rg -n "^export (function|const)" src/lib/` kosong | tidak ada fungsi/konstanta lepas |
| Web komponen | `rg -n "Math\.(round|max)|localeCompare|new Date\(\)" src/app src/components` ditelaah | tiap hit delegasi ke kelas `src/lib/` |
| Mobile `lib/src/` | `flutter analyze` 0 issue + `rg -n "EdgeInsets\.|SizedBox\(|Color\(0x" lib/src/screens lib/src/widgets` kosong | state di controller, visual dari token |
| API `app/` | `./vendor/bin/pint --test` + `rg -n "^function " app/` kosong | tanpa fungsi global baru |
| Astro `src/` | logika di `src/lib/*.ts` class | halaman `.astro` hanya render |

## R2 — Verifikasi sebelum selesai

Setiap perubahan harus lolos: `tsc`, `eslint`, `vitest`, `next build`, `php artisan test`, `pint --test`,
dan Playwright E2E (bila menyentuh UI). Untuk mobile: `flutter analyze` (0 issue), `flutter test`, dan
`flutter build apk --debug` bila menyentuh UI.

Bukti perilaku wajib disertakan, bukan hanya hijau test: jalankan aplikasinya. Untuk web, buka halaman
nyata dan sebutkan apa yang terlihat; untuk mobile, jalankan di emulator dan sebutkan hasil
`uiautomator dump` (teks yang benar-benar tampil).

## R3 — Sistem UI Mobile

Sumber kebenaran visual mobile ada di kode, bukan di dokumen terpisah: `lib/src/theme/`.

| Keputusan | Nilai | Alasan singkat |
|---|---|---|
| Dial | ENERGY 1 / RHYTHM 2 / MOTION 1 | Layar operasional dipakai sambil berdiri; tenang, tiap layar punya komposisi sendiri, tanpa animasi hiasan |
| Palet | "Pine & Lime" dari `apps/web/DESIGN.md` | Satu identitas dengan web: pinus untuk aksi, limau sebagai satu-satunya aksen |
| Warna | `AppPalette` → `ColorScheme` (`AppTheme.light()`/`dark()`) | Mode mengikuti sistem; tidak ada sakelar tema di aplikasi |
| Tipografi | Plus Jakarta Sans (variable, `assets/fonts/`) | Sama dengan web; angka nominal memakai figur tabular |
| Bentuk | radius 10 (chip) / 12 (field, tombol) / 16 (kartu) / 24 (dialog) | Radius bertingkat sebagai penanda hierarki, bukan serba pil |
| Elevasi | Kartu rata + garis tepi; hanya FAB memakai bayangan | Hierarki dari batas, bukan dari ketinggian |
| Kontras | ≥ 4.5:1 untuk semua pasangan teks/latar | Diuji otomatis di `test/theme_test.dart` |

Menambah layar baru: buat `class` di `lib/src/screens/`, bungkus dengan `AppScaffold`, isi dengan
`AsyncSection` + widget dari `lib/src/widgets/`, dan jangan menulis warna atau jarak sendiri.

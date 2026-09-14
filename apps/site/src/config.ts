// URL aplikasi (dashboard/POS) yang dipakai CTA "Masuk"/"Lacak cucian".
// Nilainya datang dari PUBLIC_APP_URL saat build; build produksi
// (Dockerfile.prod) menolak berjalan tanpa variabel itu, sehingga HTML produksi
// tidak pernah memuat tautan localhost. Nilai cadangan hanya untuk `astro dev`
// di mesin developer (dashboard dev berjalan di :3000).
export const appUrl = import.meta.env.PUBLIC_APP_URL ?? "http://localhost:3000";

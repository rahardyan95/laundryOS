"use client";

import { useSyncExternalStore, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  Bell,
  ListChecks,
  Menu,
  ReceiptText,
  TrendingUp,
  Truck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { StatusBadge } from "@/components/orders/status-badge";
import { SessionManager } from "@/lib/api/session";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ReceiptText,
    title: "Order & ticket otomatis",
    description: "Kasir mencatat order dalam hitungan detik — nomor ticket unik langsung tercetak.",
  },
  {
    icon: ListChecks,
    title: "Status tahap demi tahap",
    description: "Diterima, dicuci, dikeringkan, disetrika, sampai siap — setiap pindah tercatat siapa dan kapan.",
  },
  {
    icon: Truck,
    title: "Antar-jemput terjadwal",
    description: "Tugaskan pickup dan delivery ke kurir lengkap dengan jadwal dan bukti serah-terima.",
  },
  {
    icon: Wallet,
    title: "Kas & tutup harian",
    description: "Pemasukan-pengeluaran tercatat, tanggal yang ditutup terkunci dari perubahan.",
  },
  {
    icon: TrendingUp,
    title: "Laporan & ekspor",
    description: "Omzet harian, beban kerja, layanan terlaris — unduh CSV untuk pembukuan.",
  },
  {
    icon: Bell,
    title: "Notifikasi otomatis",
    description: "Staf dan alur kerja diberi tahu saat order masuk, siap, dan selesai.",
  },
];

const roles: { title: string; description: string }[] = [
  { title: "Owner", description: "Omzet, piutang, dan kas semua outlet dalam satu dashboard." },
  { title: "Kasir", description: "Entry order kilat dengan default cerdas dan pelanggan tersimpan." },
  { title: "Operator", description: "Antrean kerja yang jelas — tahu cucian mana yang diproses duluan." },
  { title: "Kurir", description: "Daftar pickup dan delivery rapi dengan alamat dan bukti foto." },
];

const stages = ["Diterima", "Dicuci", "Dikeringkan", "Disetrika", "Siap Diambil", "Selesai"] as const;

export function HomeClient() {
  // Sesi dibaca lewat useSyncExternalStore dengan snapshot server null:
  // HTML SSR/prerender dan render pertama klien identik ("belum login"),
  // sesi nyata dipakai setelah mount — anti hydration mismatch.
  const session = useSyncExternalStore(
    SessionManager.subscribe,
    SessionManager.getSnapshot,
    () => null
  );
  const loggedIn = session !== null;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="LaundryOS beranda">
            <Logo size={34} tone="on-light" />
          </Link>
          <nav className="ml-6 hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Navigasi utama">
            <a href="#fitur" className="text-muted-foreground transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#alur" className="text-muted-foreground transition-colors hover:text-foreground">
              Alur Kerja
            </a>
            <a href="#peran" className="text-muted-foreground transition-colors hover:text-foreground">
              Peran
            </a>
            <Link href="/lacak" className="text-muted-foreground transition-colors hover:text-foreground">
              Lacak Cucian
            </Link>
          </nav>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Button asChild>
              <Link href={loggedIn ? "/dashboard" : "/login"}>
                {loggedIn ? "Buka Dashboard" : "Masuk"}
              </Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </Button>
        </div>
        {menuOpen ? (
          <nav className="border-t px-4 py-3 md:hidden" aria-label="Navigasi seluler">
            <div className="flex flex-col gap-1 text-sm font-medium">
              <a href="#fitur" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted">
                Fitur
              </a>
              <a href="#alur" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted">
                Alur Kerja
              </a>
              <a href="#peran" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted">
                Peran
              </a>
              <Link href="/lacak" onClick={() => setMenuOpen(false)} className="rounded-md px-2 py-2 hover:bg-muted">
                Lacak Cucian
              </Link>
              <Link
                href={loggedIn ? "/dashboard" : "/login"}
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-md bg-primary px-2 py-2 text-center font-semibold text-primary-foreground"
              >
                {loggedIn ? "Buka Dashboard" : "Masuk"}
              </Link>
            </div>
          </nav>
        ) : null}
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-enter">
              <p className="mb-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide">
                Untuk laundry kiloan &amp; satuan
              </p>
              <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">
                Cucian tercatat.
                <br />
                Status terpantau.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                LaundryOS menggantikan buku, chat, dan spreadsheet: order masuk,
                progres cucian, pelanggan, antar-jemput, dan kas — dalam satu aplikasi.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={loggedIn ? "/dashboard" : "/login"}>Mulai Mencatat</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/lacak">Lacak Cucian</Link>
                </Button>
              </div>
            </div>
            <div className="animate-enter rounded-2xl border bg-card p-5 shadow-sm" aria-label="Ilustrasi status order">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold">KMG-20260904-001</p>
                <StatusBadge status="ironing" />
              </div>
              <ol className="mt-4 space-y-0">
                {["Diterima", "Dicuci", "Dikeringkan", "Disetrika"].map((stage, index, list) => (
                  <li key={stage} className="flex gap-3">
                    <span className="flex flex-col items-center" aria-hidden>
                      <span
                        className={`size-2.5 rounded-full ${index < 3 ? "bg-primary" : "bg-border"}`}
                      />
                      {index < list.length - 1 ? <span className="w-px flex-1 bg-border" /> : null}
                    </span>
                    <p className={`pb-4 text-sm ${index < 3 ? "font-medium" : "text-muted-foreground"}`}>
                      {stage}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Setiap tahap tercatat siapa yang mengerjakan dan kapan.
              </p>
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Semua operasional, satu tempat</h2>
          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="alur" className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Satu alur, terpantau semua</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Enam tahap baku — tidak ada status bebas yang membingungkan pelanggan.
            </p>
            <ol className="mt-6 flex flex-wrap items-center gap-2">
              {stages.map((stage, index) => (
                <li key={stage} className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-semibold">
                    <span
                      className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    {stage}
                  </span>
                  {index < stages.length - 1 ? (
                    <span className="hidden h-px w-4 bg-border sm:block" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="peran" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Dibuat untuk setiap peran</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, index) => (
              <div
                key={role.title}
                className="animate-enter-stagger rounded-2xl border bg-card p-5"
                style={{ "--i": index } as CSSProperties}
              >
                <p className="font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                  0{index + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold">{role.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-12">
            <h2 className="mx-auto max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Pelanggan tak perlu chat menanyakan cucian lagi
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm opacity-80">
              Cukup nomor ticket dan telepon — status cucian tampil seketika.
            </p>
            <Button size="lg" variant="secondary" className="mt-6 font-bold" asChild>
              <Link href="/lacak">Lacak Sekarang</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <Logo size={30} tone="on-light" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Operasional laundry kiloan &amp; satuan dalam satu aplikasi.
            </p>
          </div>
          <nav aria-label="Tautan produk">
            <p className="text-sm font-bold">Produk</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Masuk Dashboard
                </Link>
              </li>
              <li>
                <Link href="/lacak" className="hover:text-foreground">
                  Lacak Cucian
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Tautan halaman">
            <p className="text-sm font-bold">LaundryOS</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#fitur" className="hover:text-foreground">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#peran" className="hover:text-foreground">
                  Peran Pengguna
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
            © 2026 LaundryOS · Dibuat untuk UMKM laundry Indonesia
          </p>
        </div>
      </footer>
    </div>
  );
}

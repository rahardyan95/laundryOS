"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, ReceiptText, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/layout/logo";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { AppMode } from "@/lib/app-mode";
import { SessionManager } from "@/lib/api/session";

const demoAccounts = [
  { label: "Pemilik", email: "owner@laundryos.test" },
  { label: "Kasir", email: "kasir@laundryos.test" },
  { label: "Operator", email: "operator@laundryos.test" },
  { label: "Kurir", email: "kurir@laundryos.test" },
];

const highlights = [
  {
    icon: ReceiptText,
    title: "Order tercatat otomatis",
    description: "Ticket unik langsung terbit setiap transaksi.",
  },
  {
    icon: TrendingUp,
    title: "Omzet terpantau harian",
    description: "Dashboard menjawab berapa order, piutang, dan kas.",
  },
  {
    icon: Bell,
    title: "Status selalu update",
    description: "Setiap tahap tercatat siapa dan kapan.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@laundryos.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const apiMode = process.env.NEXT_PUBLIC_API_MODE;
  const demoHint = AppMode.demoHint(apiMode);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = await api.login(email.trim(), password);
      SessionManager.set(payload);
      SessionManager.setOutletId(payload.user.outletId);
      toast.success(`Selamat datang, ${payload.user.name}.`);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat masuk. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-between bg-primary px-6 py-8 text-primary-foreground sm:px-12 lg:min-h-screen lg:py-12">
        <Link href="/" aria-label="LaundryOS beranda" className="w-fit">
          <Logo size={38} tone="on-dark" />
        </Link>
        <div className="animate-enter py-10 lg:py-0">
          <h1 className="max-w-md text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Operasional laundry, rapi setiap hari.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80 sm:text-base">
            Satu aplikasi untuk order, status cucian, pelanggan, antar-jemput, dan kas outlet Anda.
          </p>
          <ul className="mt-8 space-y-5">
            {highlights.map((item, index) => (
              <li
                key={item.title}
                className="animate-enter-stagger flex gap-4"
                style={{ "--i": index } as CSSProperties}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-bold">{item.title}</span>
                  <span className="block text-sm opacity-75">{item.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-60">
          Pelanggan?{" "}
          <Link href="/lacak" className="font-semibold underline underline-offset-4">
            Lacak cucian tanpa masuk
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="animate-enter w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Masuk</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola operasional laundry Anda hari ini.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata sandi</Label>
                <Link
                  href="/lacak"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Lacak cucian?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={AppMode.passwordPlaceholder(apiMode)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {demoHint ? (
              <p className="text-xs text-muted-foreground" data-testid="demo-hint">
                {demoHint}
              </p>
            ) : null}
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" size="lg" className="w-full font-bold" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Masuk
            </Button>
          </form>
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Akun demo — klik untuk mengisi email
            </p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmail(account.email)}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            Pelanggan?{" "}
            <Link href="/lacak" className="font-semibold text-primary underline-offset-4 hover:underline">
              Lacak cucian tanpa masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

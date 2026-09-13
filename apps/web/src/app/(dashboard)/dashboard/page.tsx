"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Clock3, ReceiptText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/orders/status-badge";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { DashboardSummary } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { SessionManager } from "@/lib/api/session";

function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  const { outletId } = useOutlet();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    api
      .getDashboardSummary(outletId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat ringkasan. Periksa koneksi lalu muat ulang halaman."
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Ringkasan operasional outlet hari ini." />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Ringkasan operasional outlet hari ini." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Order Hari Ini", value: String(summary.ordersToday), hint: "order dibuat hari ini" },
    { title: "Omzet Hari Ini", value: Format.rupiah(summary.salesToday), hint: "total order hari ini" },
    { title: "Piutang", value: Format.rupiah(summary.outstanding), hint: "belum lunas, semua order aktif" },
    { title: "Saldo Kas", value: Format.rupiah(summary.cashBalance), hint: "kas outlet saat ini" },
  ];
  const session = SessionManager.get();
  const firstName = session?.user.name.split(" ")[0] ?? "";
  const outletName =
    session?.outlets.find((o) => o.id === outletId)?.name ?? "";
  const maxWorkload = Math.max(1, ...summary.workload.map((row) => row.count));

  return (
    <div className="space-y-4">
      <div className="animate-enter">
        <p className="text-sm font-medium text-muted-foreground">
          {Format.date(new Date().toISOString())}
          {outletName ? ` · ${outletName}` : ""}
        </p>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}!
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card
            key={card.title}
            className="animate-enter-stagger"
            style={{ "--i": index } as CSSProperties}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beban Kerja</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {summary.workload.map((row) => {
                const isPeak = row.count > 0 && row.count === maxWorkload;
                return (
                  <li
                    key={row.status}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center ${isPeak ? "border-amber-500 bg-amber-50" : ""}`}
                  >
                    <span className="font-mono text-2xl font-bold tabular-nums">
                      {row.count}
                    </span>
                    <StatusBadge status={row.status} />
                    <span
                      className="h-1 w-full overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={row.count}
                      aria-valuemin={0}
                      aria-valuemax={maxWorkload}
                      aria-label={`Beban ${row.status}`}
                    >
                      <span
                        className={`block h-full rounded-full ${isPeak ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${Math.round((row.count / maxWorkload) * 100)}%` }}
                      />
                    </span>
                    {isPeak ? (
                      <span className="text-[11px] font-bold tracking-wide text-amber-700">
                        TERTINGGI
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Tahap dengan antrean terbanyak adalah prioritas pengerjaan berikutnya.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perlu Diambil Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.readyWaiting.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReceiptText className="size-4" aria-hidden />
                Tidak ada cucian siap yang menunggu lebih dari 12 jam.
              </p>
            ) : (
              <ul className="space-y-3">
                {summary.readyWaiting.map((row) => (
                  <li key={row.ticket} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium">{row.ticket}</p>
                      <p className="text-xs text-muted-foreground">{row.customerName}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-amber-700">
                      <Clock3 className="size-4" aria-hidden />
                      {row.hoursWaiting} jam
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

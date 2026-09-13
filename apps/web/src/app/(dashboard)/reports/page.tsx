"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/orders/status-badge";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { ReportSummary } from "@/lib/api/types";
import { Format } from "@/lib/format";

export default function ReportsPage() {
  const { outletId } = useOutlet();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [from, setFrom] = useState(Format.isoDaysAgo(30));
  const [to, setTo] = useState(Format.isoDaysAgo(0));
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    if (!outletId) return;
    let cancelled = false;
    api
      .getReportSummary(outletId, from, to)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Gagal memuat laporan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, from, to]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await api.downloadSalesCsv(outletId, from, to);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `penjualan-${from}_${to}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Berkas CSV terunduh.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal mengunduh CSV.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laporan"
        description="Ringkasan penjualan periode berjalan."
        action={
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Unduh CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="from">Dari</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">Sampai</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading || !summary ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Omzet ({summary.from} – {summary.to})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {Format.rupiah(summary.revenueTotal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Order</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {summary.ordersTotal}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Omzet Harian</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.revenueByDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada penjualan pada periode ini.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead className="text-right">Order</TableHead>
                          <TableHead className="text-right">Omzet</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.revenueByDay.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{Format.date(row.date)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {row.orders}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {Format.rupiah(row.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order per Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.ordersByStatus
                    .filter((row) => row.count > 0)
                    .map((row) => (
                      <div key={row.status} className="flex items-center justify-between gap-2">
                        <StatusBadge status={row.status} />
                        <span className="font-mono text-sm font-semibold tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Layanan Terlaris</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.topServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada data layanan.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Layanan</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Omzet</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.topServices.map((row) => (
                            <TableRow key={row.name}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-right font-mono tabular-nums">
                                {row.qty}
                              </TableCell>
                              <TableCell className="text-right font-mono tabular-nums">
                                {Format.rupiah(row.revenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

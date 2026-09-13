"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { OrderReceipt } from "@/components/orders/order-receipt";
import { PaymentBadge } from "@/components/orders/payment-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { Order } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { OrderMachine } from "@/lib/order-machine";
import { SessionManager } from "@/lib/api/session";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api
      .getOrder(params.id)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Gagal memuat order.")
      );
  }, [params.id]);

  const mutate = useCallback(
    async (action: (actor: NonNullable<ReturnType<typeof SessionManager.get>>["user"]) => Promise<Order>, success: string) => {
      const session = SessionManager.get();
      if (!session) {
        setError("Sesi berakhir. Masuk kembali.");
        return;
      }
      setActing(true);
      setError("");
      try {
        const updated = await action(session.user);
        setOrder(updated);
        toast.success(success);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Aksi gagal. Coba lagi.");
      } finally {
        setActing(false);
      }
    },
    []
  );

  if (error && !order) {
    return (
      <div className="space-y-4">
        <PageHeader title="Order" description="Detail dan status order." />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/orders">
            <ArrowLeft className="size-4" aria-hidden />
            Kembali ke Daftar Order
          </Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <PageHeader title="Order" description="Detail dan status order." />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const next = OrderMachine.next(order.status);
  const remaining = order.total - order.paidAmount;
  const outletName = SessionManager.get()?.outlets.find((o) => o.id === order.outletId)?.name ?? "LaundryOS";
  const role = SessionManager.get()?.user.role;
  const canAdvance = role === "owner" || role === "manager" || role === "operator";
  const canCancel = role === "owner" || role === "manager" || role === "cashier";

  return (
    <div className="space-y-4">
      <div className="hidden print:block">
        <OrderReceipt order={order} outletName={outletName} />
      </div>
      <div className="space-y-4 print:hidden">
      <PageHeader
        title={order.ticket}
        description={`${order.customerName} · ${order.customerPhone}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden />
              Cetak
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/orders">
                <ArrowLeft className="size-4" aria-hidden />
                Daftar
              </Link>
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.paymentStatus} />
        <span className="text-sm text-muted-foreground">
          Dibuat {Format.dateTime(order.createdAt)}
          {order.estimatedDoneAt ? ` · Estimasi selesai ${Format.dateTime(order.estimatedDoneAt)}` : ""}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Isi Order</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Layanan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.serviceName}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {item.qty} {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {Format.rupiah(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {Format.rupiah(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {Format.rupiah(order.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span className="font-mono tabular-nums">{Format.rupiah(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {Format.rupiah(remaining)}
                  </span>
                </div>
              </div>
              {order.note ? (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
                  Catatan: {order.note}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[...order.history].reverse().map((event, index) => (
                  <li key={`${event.at}-${index}`} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 size-2.5 shrink-0 rounded-full ${index === 0 ? "bg-primary" : "bg-border"}`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium">{OrderMachine.label(event.status)}</p>
                      <p className="text-xs text-muted-foreground">
                        {Format.dateTime(event.at)} · {event.byUserName}
                        {event.note ? ` · ${event.note}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Aksi Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {next && canAdvance ? (
              <Button
                className="w-full"
                disabled={acting}
                onClick={() =>
                  mutate(
                    (actor) => api.advanceOrderStatus(order.id, actor),
                    `Status menjadi ${OrderMachine.label(next)}.`
                  )
                }
              >
                {acting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Lanjut ke {OrderMachine.label(next)}
              </Button>
            ) : order.status === "completed" ? (
              <p className="text-sm text-muted-foreground">
                Order selesai — tidak ada aksi lanjutan.
              </p>
            ) : null}
            {order.status === "received" && canCancel ? (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                disabled={acting}
                onClick={() =>
                  mutate(
                    (actor) => api.cancelOrder(order.id, actor, "Dibatalkan dari halaman detail"),
                    `Order ${order.ticket} dibatalkan.`
                  )
                }
              >
                Batalkan Order
              </Button>
            ) : null}
            {order.status === "cancelled" ? (
              <p className="text-sm text-muted-foreground">
                Order dibatalkan — riwayat tetap tersimpan untuk audit.
              </p>
            ) : null}
            {!canAdvance && !canCancel && order.status !== "completed" && order.status !== "cancelled" ? (
              <p className="text-sm text-muted-foreground">
                Status hanya dapat diubah oleh operator, manajer, atau pemilik.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

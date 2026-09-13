"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ReceiptText, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentBadge } from "@/components/orders/payment-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { SessionManager } from "@/lib/api/session";
import type { Order, OrderStatus } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { OrderMachine } from "@/lib/order-machine";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "Semua status" },
  ...OrderMachine.FLOW.concat("cancelled" as OrderStatus).map((status) => ({
    value: status,
    label: OrderMachine.label(status as OrderStatus),
  })),
];

export default function OrdersPage() {
  const { outletId } = useOutlet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    api
      .listOrders({ outletId })
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat order. Periksa koneksi lalu muat ulang halaman."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (
        q &&
        !order.ticket.toLowerCase().includes(q) &&
        !order.customerName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, statusFilter, query]);

  const role = SessionManager.get()?.user.role;
  const canCreate = role === "owner" || role === "manager" || role === "cashier";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Order"
        description="Daftar order cucian outlet."
        action={
          canCreate ? (
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="size-4" aria-hidden />
                Order Baru
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Cari nomor ticket atau nama pelanggan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Cari order"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={orders.length === 0 ? "Belum ada order" : "Tidak ada order yang cocok"}
          description={
            orders.length === 0
              ? "Order pertama belum dicatat. Buat order baru untuk memulai."
              : "Ubah kata kunci atau filter status untuk melihat order lain."
          }
          action={
            orders.length === 0 ? (
              <Button asChild>
                <Link href="/orders/new">
                  <Plus className="size-4" aria-hidden />
                  Buat Order Baru
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Isi</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bayar</TableHead>
                <TableHead>Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {order.ticket}
                    </Link>
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                    {order.items.map((item) => `${item.serviceName} ${item.qty}${item.unit}`).join(" · ")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {Format.rupiah(order.total)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Format.dateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

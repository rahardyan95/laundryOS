"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { Customer, Order } from "@/lib/api/types";
import { Format } from "@/lib/format";

interface CustomerRow extends Customer {
  orderCount: number;
  lastOrderAt: string | null;
}

export default function CustomersPage() {
  const { outletId } = useOutlet();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    Promise.all([api.listCustomers(), api.listOrders({ outletId })])
      .then(([customers, orders]) => {
        if (cancelled) return;
        const byCustomer = new Map<string, Order[]>();
        for (const order of orders) {
          const list = byCustomer.get(order.customerId) ?? [];
          list.push(order);
          byCustomer.set(order.customerId, list);
        }
        setRows(
          customers
            .filter((c) => c.outletId === outletId)
            .map((customer) => {
              const history = (byCustomer.get(customer.id) ?? []).sort((a, b) =>
                b.createdAt.localeCompare(a.createdAt)
              );
              return {
                ...customer,
                orderCount: history.length,
                lastOrderAt: history[0]?.createdAt ?? null,
              };
            })
        );
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Gagal memuat pelanggan.");
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
    if (!q) return rows;
    return rows.filter(
      (row) => row.name.toLowerCase().includes(q) || row.phone.includes(q)
    );
  }, [rows, query]);

  function openCreate() {
    setEditing(null);
    setName("");
    setPhone("");
    setAddress("");
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address ?? "");
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name.trim() || !phone.trim()) {
      setFormError("Nama dan nomor telepon wajib diisi.");
      return;
    }
    if (!outletId) return;
    setSaving(true);
    setFormError("");
    try {
      const saved = await api.upsertCustomer({
        id: editing?.id,
        outletId,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
      setRows((prev) => {
        const rest = prev.filter((row) => row.id !== saved.id);
        const existing = prev.find((row) => row.id === saved.id);
        return [
          { ...saved, orderCount: existing?.orderCount ?? 0, lastOrderAt: existing?.lastOrderAt ?? null },
          ...rest,
        ];
      });
      toast.success(editing ? "Pelanggan diperbarui." : `Pelanggan ${saved.name} tersimpan.`);
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan pelanggan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pelanggan"
        description="Data pelanggan dan riwayat order."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Pelanggan Baru
          </Button>
        }
      />

      <Input
        placeholder="Cari nama atau nomor telepon…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
        aria-label="Cari pelanggan"
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={rows.length === 0 ? "Belum ada pelanggan" : "Tidak ada pelanggan yang cocok"}
          description={
            rows.length === 0
              ? "Tambahkan pelanggan pertama agar order bisa dicatat dengan cepat."
              : "Ubah kata kunci pencarian untuk melihat pelanggan lain."
          }
          action={
            rows.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                Tambah Pelanggan
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right">Order</TableHead>
                <TableHead>Terakhir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-sm">{row.phone}</TableCell>
                  <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                    {row.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {row.orderCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.lastOrderAt ? Format.date(row.lastOrderAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah Pelanggan" : "Pelanggan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cust-name">Nama</Label>
              <Input
                id="cust-name"
                placeholder="Nama pelanggan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-phone">Telepon</Label>
              <Input
                id="cust-phone"
                placeholder="08…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-address">Alamat (opsional)</Label>
              <Textarea
                id="cust-address"
                placeholder="Alamat untuk antar-jemput"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
              />
            </div>
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, LockOpen, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { CashEntry, CashEntryType, CashSummary, PaymentMethod } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { SessionManager } from "@/lib/api/session";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const categories = ["Laundry", "Deterjen", "Plastik & Kemasan", "Listrik & Air", "Gaji", "Sewa", "Lainnya"];

export default function CashPage() {
  const { outletId } = useOutlet();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<CashEntryType>("income");
  const [category, setCategory] = useState("Laundry");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const role = SessionManager.get()?.user.role ?? "";
  const canManage = role === "owner" || role === "manager";

  const reload = useCallback(() => {
    if (!outletId) return;
    let cancelled = false;
    Promise.all([api.listCashEntries(outletId, date), api.getCashSummary(outletId, date)])
      .then(([entryList, cashSummary]) => {
        if (cancelled) return;
        setEntries(entryList);
        setSummary(cashSummary);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Gagal memuat kas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, date]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  async function handleCreate() {
    const value = Number(amount);
    if (!category.trim() || !Number.isFinite(value) || value < 1) {
      setError("Kategori dan nominal (minimal Rp1) wajib diisi.");
      return;
    }
    const session = SessionManager.get();
    if (!session) {
      setError("Sesi berakhir. Masuk kembali.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const entry = await api.createCashEntry(
        {
          outletId,
          type,
          category: category.trim(),
          amount: Math.round(value),
          paymentMethod,
          note: note.trim() || undefined,
          occurredAt: date,
        },
        session.user
      );
      setEntries((prev) => [entry, ...prev]);
      reload();
      toast.success("Kas tercatat.");
      setDialogOpen(false);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan kas.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    setError("");
    try {
      await api.closeCash(outletId, date);
      toast.success(`Kas tanggal ${date} ditutup.`);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menutup kas.");
    }
  }

  async function handleReopen() {
    setError("");
    try {
      await api.reopenCash(outletId, date);
      toast.success(`Kas tanggal ${date} dibuka kembali.`);
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuka kas.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kas"
        description="Pemasukan, pengeluaran, dan tutup kas harian."
        action={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
              aria-label="Tanggal kas"
            />
            {!summary?.closed ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Catat Kas
              </Button>
            ) : null}
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading || !summary ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Masuk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xl font-semibold tabular-nums text-emerald-700">
                  {Format.rupiah(summary.income)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Keluar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xl font-semibold tabular-nums text-red-700">
                  {Format.rupiah(summary.expense)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xl font-semibold tabular-nums">
                  {Format.rupiah(summary.balance)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {summary.closed ? (
                  <Badge variant="outline" className="border-stone-300 bg-stone-100 text-stone-700">
                    <Lock className="mr-1 size-3" aria-hidden />
                    Ditutup
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                    <LockOpen className="mr-1 size-3" aria-hidden />
                    Terbuka
                  </Badge>
                )}
                {canManage && !summary.closed ? (
                  <div>
                    <Button variant="outline" size="sm" onClick={handleClose}>
                      Tutup Kas Hari Ini
                    </Button>
                  </div>
                ) : null}
                {canManage && summary.closed ? (
                  <div>
                    <Button variant="outline" size="sm" onClick={handleReopen}>
                      Buka Kembali
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Belum ada catatan kas"
              description="Catat pemasukan dan pengeluaran tanggal ini agar kas terpantau."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.category}</TableCell>
                      <TableCell>
                        {entry.type === "income" ? (
                          <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                            Masuk
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                            Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {Format.rupiah(entry.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.paymentMethod === "cash"
                          ? "Tunai"
                          : entry.paymentMethod === "transfer"
                            ? "Transfer"
                            : entry.paymentMethod === "qris"
                              ? "QRIS"
                              : "—"}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                        {entry.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Kas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Jenis</Label>
              <Select value={type} onValueChange={(v) => setType(v as CashEntryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amt">Nominal (Rp)</Label>
              <Input
                id="amt"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Metode</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="cash-note">Catatan (opsional)</Label>
              <Textarea
                id="cash-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

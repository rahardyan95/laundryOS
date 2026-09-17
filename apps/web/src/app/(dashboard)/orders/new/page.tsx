"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type {
  Customer,
  PaymentMethod,
  Service,
} from "@/lib/api/types";
import { Format } from "@/lib/format";
import { OrderPricing } from "@/lib/order-pricing";
import { PaymentPolicy } from "@/lib/payment-policy";
import { SessionManager } from "@/lib/api/session";

interface ItemDraft {
  key: number;
  serviceId: string;
  qty: string;
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const { outletId } = useOutlet();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ key: 0, serviceId: "", qty: "" }]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listCustomers(), api.listServices()])
      .then(([customerList, serviceList]) => {
        if (cancelled) return;
        setCustomers(customerList);
        setServices(serviceList.filter((s) => s.active));
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Gagal memuat data pelanggan dan layanan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pricedItems = useMemo(() => OrderPricing.priceAll(items, services), [items, services]);

  const total = OrderPricing.total(pricedItems);
  const { paid, status: paymentStatus } = OrderPricing.status(paidAmount, total);
  const payLabel = PaymentPolicy.label(paymentStatus);

  function updateItem(key: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.key !== key)));
  }

  async function handleCreateCustomer() {
    if (!outletId || !newName.trim() || !newPhone.trim()) {
      setError("Nama dan nomor telepon pelanggan baru wajib diisi.");
      return;
    }
    setError("");
    try {
      const created = await api.upsertCustomer({
        outletId,
        name: newName.trim(),
        phone: newPhone.trim(),
        address: newAddress.trim() || undefined,
      });
      setCustomers((prev) => [created, ...prev]);
      setCustomerId(created.id);
      setShowNewCustomer(false);
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      toast.success(`Pelanggan ${created.name} tersimpan.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan pelanggan.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const check = PaymentPolicy.validateDraft({
      hasCustomer: Boolean(customerId),
      hasItems: pricedItems.some((item) => item.service && item.qty > 0),
      paid,
      total,
    });
    if (!check.valid) {
      setError(check.message);
      return;
    }
    const session = SessionManager.get();
    if (!session || !outletId) {
      setError("Sesi berakhir. Masuk kembali.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const order = await api.createOrder(
        {
          outletId,
          customerId,
          items: pricedItems
            .filter((item) => item.service && item.qty > 0)
            .map((item) => ({ serviceId: item.serviceId, qty: item.qty })),
          note: note.trim() || undefined,
          pickupRequested: false,
          deliveryRequested: false,
          paymentMethod,
          paymentStatus,
          paidAmount: paid,
        },
        session.user
      );
      toast.success(`Order ${order.ticket} tercatat.`);
      router.replace(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan order. Coba lagi.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Order Baru" description="Catat order cucian baru." />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Order Baru" description="Catat order cucian baru." />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customer">Pilih pelanggan</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Ketik atau pilih nama…" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} — {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {showNewCustomer ? (
                <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="new-name">Nama</Label>
                    <Input
                      id="new-name"
                      placeholder="Nama pelanggan"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-phone">Telepon</Label>
                    <Input
                      id="new-phone"
                      placeholder="08…"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="new-address">Alamat (opsional)</Label>
                    <Input
                      id="new-address"
                      placeholder="Alamat untuk antar-jemput"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="button" size="sm" onClick={handleCreateCustomer}>
                      Simpan Pelanggan
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNewCustomer(false)}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCustomer(true)}
                >
                  <Plus className="size-4" aria-hidden />
                  Pelanggan Baru
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((draft) => (
                <div key={draft.key} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`service-${draft.key}`}>Layanan</Label>
                    <Select
                      value={draft.serviceId}
                      onValueChange={(value) => updateItem(draft.key, { serviceId: value })}
                    >
                      <SelectTrigger id={`service-${draft.key}`}>
                        <SelectValue placeholder="Pilih layanan…" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} — {Format.rupiah(service.pricePerUnit)}/{service.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label htmlFor={`qty-${draft.key}`}>Jumlah</Label>
                    <Input
                      id={`qty-${draft.key}`}
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                      placeholder="0"
                      value={draft.qty}
                      onChange={(e) => updateItem(draft.key, { qty: e.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(draft.key)}
                    aria-label="Hapus layanan"
                  >
                    <Minus className="size-4" aria-hidden />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { key: Date.now(), serviceId: "", qty: "" },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden />
                Tambah Layanan
              </Button>
              <div className="space-y-1 pt-1">
                <Label htmlFor="note">Catatan (opsional)</Label>
                <Textarea
                  id="note"
                  placeholder="Contoh: noda kopi di kemeja putih"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="text-base">Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="method">Metode</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paid">Dibayar (Rp)</Label>
              <Input
                id="paid"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Status bayar</span>
                <span className="font-medium text-foreground">{payLabel}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono text-2xl font-semibold tabular-nums">
                  {Format.rupiah(total)}
                </span>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan Order
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

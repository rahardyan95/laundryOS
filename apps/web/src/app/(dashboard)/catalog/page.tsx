"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { SessionManager } from "@/lib/api/session";
import type { Service, ServiceUnit } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { NavPolicy } from "@/lib/nav-policy";
import { ServicePricing } from "@/lib/service-pricing";
import { Sorter } from "@/lib/sorter";

const units: { value: ServiceUnit; label: string }[] = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "pcs", label: "Potong (pcs)" },
  { value: "pasang", label: "Pasang" },
];

export default function CatalogPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<ServiceUnit>("kg");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .listServices()
      .then((data) => {
        if (!cancelled) setServices(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Gagal memuat katalog layanan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setUnit("kg");
    setPrice("");
    setHours("48");
    setActive(true);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setName(service.name);
    setUnit(service.unit);
    setPrice(String(service.pricePerUnit));
    setHours(String(service.estimatedHours));
    setActive(service.active);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    const priceValue = Number(price);
    const hoursValue = Number(hours);
    if (!name.trim()) {
      setFormError("Nama layanan wajib diisi.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setFormError("Harga harus angka lebih dari 0.");
      return;
    }
    if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
      setFormError("Estimasi waktu harus angka lebih dari 0 jam.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const saved = await api.upsertService({
        id: editing?.id,
        name: name.trim(),
        unit,
        pricePerUnit: ServicePricing.roundPrice(priceValue),
        estimatedHours: ServicePricing.roundHours(hoursValue),
        active,
      });
      setServices((prev) => {
        const rest = prev.filter((s) => s.id !== saved.id);
        return Sorter.byNameAsc([...rest, saved]);
      });
      toast.success(editing ? "Layanan diperbarui." : `Layanan ${saved.name} tersimpan.`);
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Gagal menyimpan layanan.");
    } finally {
      setSaving(false);
    }
  }

  const role = SessionManager.get()?.user.role;
  const canManage = NavPolicy.canManageCatalog(role);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Katalog Layanan"
        description="Daftar layanan, satuan, dan harga."
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Layanan Baru
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Skeleton className="h-64" />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Katalog masih kosong"
          description="Tambahkan layanan pertama agar kasir bisa mencatat order."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Tambah Layanan
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead>Estimasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.unit}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {Format.rupiah(service.pricePerUnit)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Format.duration(service.estimatedHours)}
                  </TableCell>
                  <TableCell>
                    {service.active ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-stone-300 bg-stone-100 text-stone-500">
                        Nonaktif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                        Ubah
                      </Button>
                    ) : null}
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
            <DialogTitle>{editing ? "Ubah Layanan" : "Layanan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="svc-name">Nama layanan</Label>
              <Input
                id="svc-name"
                placeholder="Contoh: Cuci Setrika"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-unit">Satuan</Label>
              <Select value={unit} onValueChange={(value) => setUnit(value as ServiceUnit)}>
                <SelectTrigger id="svc-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-status">Status</Label>
              <Select value={active ? "active" : "inactive"} onValueChange={(v) => setActive(v === "active")}>
                <SelectTrigger id="svc-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-price">Harga per satuan (Rp)</Label>
              <Input
                id="svc-price"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="11000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="svc-hours">Estimasi (jam)</Label>
              <Input
                id="svc-hours"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="48"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            {formError ? (
              <Alert variant="destructive" className="sm:col-span-2">
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

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Truck, Upload } from "lucide-react";
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
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { DeliveryTask, DeliveryTaskType, Order, User } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { SessionManager } from "@/lib/api/session";
import { TaskMachine } from "@/lib/task-machine";

export default function TasksPage() {
  const { outletId } = useOutlet();
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState("");

  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<DeliveryTaskType>("pickup");
  const [scheduled, setScheduled] = useState("");
  const [address, setAddress] = useState("");
  const [driverId, setDriverId] = useState("");

  const role = SessionManager.get()?.user.role ?? "";
  const canManage = role === "owner" || role === "manager";

  const reload = useCallback(() => {
    if (!outletId) return;
    let cancelled = false;
    Promise.all([
      api.listDeliveryTasks(),
      canManage ? api.listOrders({ outletId }) : Promise.resolve([] as Order[]),
      canManage ? api.listUsers("driver") : Promise.resolve([] as User[]),
    ])
      .then(([taskList, orderList, driverList]) => {
        if (cancelled) return;
        setTasks(taskList);
        setOrders(orderList.filter((o) => o.status !== "completed" && o.status !== "cancelled"));
        setDrivers(driverList);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Gagal memuat task antar-jemput.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, canManage]);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  async function handleCreate() {
    if (!orderId || !scheduled) {
      setError("Order dan jadwal wajib diisi.");
      return;
    }
    if (new Date(scheduled).getTime() <= Date.now()) {
      setError("Jadwal harus di masa depan.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const task = await api.createDeliveryTask({
        orderId,
        type,
        scheduledAt: new Date(scheduled).toISOString(),
        address: address.trim() || undefined,
        driverId: driverId || undefined,
      });
      setTasks((prev) => [...prev, task]);
      toast.success(`Task ${type === "pickup" ? "pickup" : "delivery"} dibuat.`);
      setDialogOpen(false);
      setOrderId("");
      setScheduled("");
      setAddress("");
      setDriverId("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance(task: DeliveryTask) {
    const next = TaskMachine.next(task.status);
    if (!next) return;
    setActingId(task.id);
    setError("");
    try {
      const updated = await api.advanceDeliveryTask(task.id, next);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Status task diperbarui.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah status.");
    } finally {
      setActingId("");
    }
  }

  async function handleProof(task: DeliveryTask, file: File | undefined) {
    if (!file) return;
    setActingId(task.id);
    setError("");
    try {
      const updated = await api.uploadDeliveryProof(task.id, file);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Bukti serah-terima tersimpan.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah bukti.");
    } finally {
      setActingId("");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Antar-Jemput"
        description="Jadwal pickup dan delivery."
        action={
          canManage ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Task Baru
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
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Belum ada task"
          description={
            canManage
              ? "Buat task pickup atau delivery pertama untuk order yang berjalan."
              : "Belum ada task yang ditugaskan kepada Anda."
          }
          action={
            canManage ? (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Buat Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jadwal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Kurir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const label = TaskMachine.nextLabel(task.status);
                const next = TaskMachine.next(task.status);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="text-sm">
                      {task.scheduledAt ? Format.dateTime(task.scheduledAt) : "—"}
                    </TableCell>
                    <TableCell>{task.type === "pickup" ? "Pickup" : "Delivery"}</TableCell>
                    <TableCell>
                      <Link
                        href={`/orders/${task.orderId}`}
                        className="font-mono text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {task.orderTicket}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{task.driverName ?? "—"}</TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {label && next ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actingId === task.id}
                            onClick={() => handleAdvance(task)}
                          >
                            {actingId === task.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : null}
                            {label}
                          </Button>
                        ) : null}
                        {(task.status === "in_progress" || task.status === "done") && !task.proofUrl ? (
                          <Button variant="ghost" size="sm" asChild disabled={actingId === task.id}>
                            <label className="cursor-pointer">
                              <Upload className="size-4" aria-hidden />
                              Bukti
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleProof(task, e.target.files?.[0])}
                              />
                            </label>
                          </Button>
                        ) : null}
                        {task.proofUrl ? (
                          <span className="px-2 py-1 text-xs text-emerald-700">Bukti tersimpan</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Order</Label>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih order…" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.ticket} — {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Jenis</Label>
                <Select value={type} onValueChange={(v) => setType(v as DeliveryTaskType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sched">Jadwal</Label>
                <Input
                  id="sched"
                  type="datetime-local"
                  value={scheduled}
                  onChange={(e) => setScheduled(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="addr">Alamat</Label>
              <Input
                id="addr"
                placeholder="Alamat pickup/delivery"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Kurir (opsional)</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tugaskan nanti…" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, Plus, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { PageHeader } from "@/components/shared/page-header";
import { useOutlet } from "@/components/layout/outlet-context";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { Outlet, Role, Subscription, User } from "@/lib/api/types";
import { NavPolicy } from "@/lib/nav-policy";
import { SessionManager } from "@/lib/api/session";

const plans = [
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "multi_outlet", label: "Multi-Outlet" },
];

const roles: { value: Role; label: string }[] = [
  { value: "manager", label: "Manajer" },
  { value: "cashier", label: "Kasir" },
  { value: "operator", label: "Operator" },
  { value: "driver", label: "Kurir" },
];

export default function SettingsPage() {
  const { outletId } = useOutlet();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [outletDialog, setOutletDialog] = useState(false);
  const [outletCode, setOutletCode] = useState("");
  const [outletName, setOutletName] = useState("");
  const [savingOutlet, setSavingOutlet] = useState(false);

  const [userDialog, setUserDialog] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<Role>("cashier");
  const [savingUser, setSavingUser] = useState(false);

  const session = SessionManager.get();
  const isOwner = session?.user.role === "owner";

  const reload = useCallback(() => {
    const payload = SessionManager.get();
    if (!payload) return;
    let cancelled = false;
    const manageable =
      payload.user.role === "owner" || payload.user.role === "manager";
    Promise.all([
      api.getSubscription(),
      api.getOutlets(),
      manageable ? api.listUsers() : Promise.resolve([] as User[]),
    ])
      .then(([sub, outletList, staffList]) => {
        if (cancelled) return;
        setSubscription(sub);
        setOutlets(outletList);
        setStaff(staffList);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Gagal memuat pengaturan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  async function handlePlanChange(plan: string) {
    setError("");
    try {
      const updated = await api.updateSubscription(plan);
      setSubscription(updated);
      toast.success(`Paket berubah ke ${updated.planLabel}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengubah paket.");
    }
  }

  async function handleCreateOutlet() {
    if (!outletCode.trim() || !outletName.trim()) {
      setError("Kode dan nama outlet wajib diisi.");
      return;
    }
    setSavingOutlet(true);
    setError("");
    try {
      const created = await api.createOutlet({
        code: outletCode.trim().toUpperCase(),
        name: outletName.trim(),
      });
      setOutlets((prev) => [...prev, created]);
      toast.success(`Outlet ${created.name} ditambahkan.`);
      setOutletDialog(false);
      setOutletCode("");
      setOutletName("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah outlet.");
    } finally {
      setSavingOutlet(false);
    }
  }

  async function handleInvite() {
    if (!userName.trim() || !userEmail.trim() || userPassword.length < 8) {
      setError("Nama, email, dan kata sandi (min. 8 karakter) wajib diisi.");
      return;
    }
    setSavingUser(true);
    setError("");
    try {
      const created = await api.inviteUser({
        name: userName.trim(),
        email: userEmail.trim(),
        password: userPassword,
        role: userRole,
        outletId: outletId || undefined,
      });
      setStaff((prev) => [...prev, created]);
      toast.success(`${created.name} ditambahkan sebagai ${NavPolicy.roleLabel(created.role)}.`);
      setUserDialog(false);
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menambah staf.");
    } finally {
      setSavingUser(false);
    }
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <PageHeader title="Pengaturan" description="Outlet, staf, dan langganan." />
        <p className="text-sm text-muted-foreground">Sesi berakhir. Muat ulang dan masuk kembali.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan" description="Outlet, staf, dan langganan." />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading || !subscription ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Langganan — {subscription.planLabel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <UsageRow label="Outlet" used={subscription.usage.outlets} limit={subscription.limits.outlets} />
                <UsageRow label="Pengguna" used={subscription.usage.users} limit={subscription.limits.users} />
                <UsageRow
                  label="Order bulan ini"
                  used={subscription.usage.orders_this_month}
                  limit={subscription.limits.orders_per_month}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Status: {subscription.status} · Penagihan manual oleh admin.
              </p>
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor="plan" className="text-sm">
                    Ubah paket
                  </Label>
                  <Select value={subscription.plan} onValueChange={handlePlanChange}>
                    <SelectTrigger id="plan" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4" aria-hidden />
                Akun Saya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{session.user.name}</p>
              <p className="text-muted-foreground">{session.user.email}</p>
              <p className="text-muted-foreground">
                Peran: {NavPolicy.roleLabel(session.user.role)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Building2 className="size-4" aria-hidden />
                  Outlet ({outlets.length})
                </span>
                {isOwner ? (
                  <Button size="sm" variant="outline" onClick={() => setOutletDialog(true)}>
                    <Plus className="size-4" aria-hidden />
                    Tambah
                  </Button>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outlets.map((outlet) => (
                <div key={outlet.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {outlet.name}{" "}
                    <span className="font-mono text-xs text-muted-foreground">{outlet.code}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{outlet.address}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="size-4" aria-hidden />
                  Staf ({staff.length})
                </span>
                {isOwner ? (
                  <Button size="sm" variant="outline" onClick={() => setUserDialog(true)}>
                    <Plus className="size-4" aria-hidden />
                    Invite
                  </Button>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isOwner ? "Belum ada data staf." : "Daftar staf hanya untuk pemilik/manajer."}
                </p>
              ) : (
                staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {NavPolicy.roleLabel(member.role)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={outletDialog} onOpenChange={setOutletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Outlet</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="outlet-code">Kode (maks 10 huruf)</Label>
              <Input
                id="outlet-code"
                placeholder="SBY"
                value={outletCode}
                onChange={(e) => setOutletCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="outlet-name">Nama outlet</Label>
              <Input
                id="outlet-name"
                placeholder="LaundryOS Surabaya"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOutletDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateOutlet} disabled={savingOutlet}>
              {savingOutlet ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staf</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="staff-name">Nama</Label>
              <Input
                id="staff-name"
                placeholder="Nama staf"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="staf@laundryos.test"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="staff-password">Kata sandi awal</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="Min. 8 karakter"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Peran</Label>
              <Select value={userRole} onValueChange={(v) => setUserRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUserDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleInvite} disabled={savingUser}>
              {savingUser ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Kirim Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

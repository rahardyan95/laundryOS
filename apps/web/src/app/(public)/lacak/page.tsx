"use client";

import { useState } from "react";
import { Loader2, PackageSearch } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/orders/status-badge";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import type { OrderStatus, TrackedOrder } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { OrderMachine } from "@/lib/order-machine";

export default function TrackPage() {
  const [ticket, setTicket] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!ticket.trim() || !phone.trim()) {
      setError("Nomor ticket dan telepon wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      setOrder(await api.trackOrder(ticket.trim(), phone.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tidak dapat melacak. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const stageIndex = order ? OrderMachine.FLOW.indexOf(order.status) : -1;

  return (
    <div className="w-full max-w-2xl">
      <div className="animate-enter overflow-hidden rounded-3xl bg-primary text-primary-foreground">
        <div className="px-6 pt-8 pb-6 text-center sm:px-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Lacak Cucian</h1>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-80">
            Masukkan nomor ticket dan nomor telepon yang didaftarkan saat order.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 grid max-w-lg gap-2 rounded-2xl bg-white p-2 text-left sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="px-2 pt-1 sm:pt-0">
              <Label htmlFor="ticket" className="sr-only">
                Nomor ticket
              </Label>
              <Input
                id="ticket"
                placeholder="No. ticket — cth KMG-20260904-001"
                autoComplete="off"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                required
                className="border-0 text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="border-t px-2 pt-1 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
              <Label htmlFor="phone" className="sr-only">
                Nomor telepon
              </Label>
              <Input
                id="phone"
                placeholder="No. telepon — cth 08…"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-0 text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" disabled={loading} className="bg-accent font-bold text-accent-foreground hover:brightness-95">
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Lacak
            </Button>
          </form>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {order ? (
        <Card className="animate-enter mt-4 overflow-hidden">
          <div className="border-b bg-muted/40 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground">TICKET</p>
                <p className="font-mono text-2xl font-bold tracking-tight">{order.ticket}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {order.customerName}
                  {order.estimatedDoneAt
                    ? ` · Estimasi selesai ${Format.dateTime(order.estimatedDoneAt)}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            {order.status !== "cancelled" ? (
              <ol className="mt-5 flex items-center" aria-label="Tahapan cucian">
                {OrderMachine.FLOW.map((stage: OrderStatus, index: number) => {
                  const done = index < stageIndex;
                  const current = index === stageIndex;
                  return (
                    <li key={stage} className={`flex items-center ${index < OrderMachine.FLOW.length - 1 ? "flex-1" : ""}`}>
                      <span className="flex flex-col items-center gap-1.5" title={OrderMachine.label(stage)}>
                        <span
                          aria-hidden
                          className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${
                            done || current
                              ? "bg-primary text-primary-foreground"
                              : "border bg-background text-muted-foreground"
                          } ${current ? "ring-4 ring-primary/20" : ""}`}
                        >
                          {done ? "✓" : index + 1}
                        </span>
                        <span className={`hidden text-[11px] font-medium sm:block ${current ? "" : "text-muted-foreground"}`}>
                          {OrderMachine.label(stage)}
                        </span>
                      </span>
                      {index < OrderMachine.FLOW.length - 1 ? (
                        <span
                          aria-hidden
                          className={`mx-1 mb-5 h-0.5 flex-1 rounded ${index < stageIndex ? "bg-primary" : "bg-border"}`}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
          <CardContent className="space-y-4 pt-5">
            <ul className="space-y-1.5 text-sm">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between gap-2">
                  <span>
                    {item.serviceName}{" "}
                    <span className="text-muted-foreground">
                      ({item.qty} {item.unit})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-mono text-xl font-bold tabular-nums">
                {Format.rupiah(order.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : !error && !loading ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <PackageSearch className="size-9" aria-hidden />
          <p>Hasil pelacakan akan tampil di sini.</p>
        </div>
      ) : null}
    </div>
  );
}

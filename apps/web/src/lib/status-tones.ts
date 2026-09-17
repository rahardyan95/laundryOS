import type { DeliveryTaskStatus, OrderStatus, PaymentStatus } from "@/lib/api/types";

export class StatusTones {
  private static readonly order: Record<OrderStatus, string> = {
    received: "border-stone-300 bg-stone-100 text-stone-700",
    washing: "border-sky-200 bg-sky-100 text-sky-800",
    drying: "border-amber-200 bg-amber-100 text-amber-800",
    ironing: "border-violet-200 bg-violet-100 text-violet-800",
    ready: "border-transparent bg-primary text-primary-foreground",
    completed: "border-emerald-200 bg-emerald-100 text-emerald-800",
    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  private static readonly payment: Record<PaymentStatus, string> = {
    paid: "border-emerald-200 bg-emerald-100 text-emerald-800",
    partial: "border-amber-200 bg-amber-100 text-amber-800",
    unpaid: "border-red-200 bg-red-50 text-red-700",
  };

  private static readonly task: Record<DeliveryTaskStatus, string> = {
    pending: "border-stone-300 bg-stone-100 text-stone-700",
    assigned: "border-sky-200 bg-sky-100 text-sky-800",
    in_progress: "border-amber-200 bg-amber-100 text-amber-800",
    done: "border-emerald-200 bg-emerald-100 text-emerald-800",
    cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  static orderTone(status: OrderStatus): string {
    return StatusTones.order[status];
  }

  static paymentTone(status: PaymentStatus): string {
    return StatusTones.payment[status];
  }

  static taskTone(status: DeliveryTaskStatus): string {
    return StatusTones.task[status];
  }
}

import type { Order, OrderStatus } from "@/lib/api/types";

export class OrderMachine {
  static readonly FLOW: OrderStatus[] = [
    "received",
    "washing",
    "drying",
    "ironing",
    "ready",
    "completed",
  ];

  static next(current: OrderStatus): OrderStatus | null {
    const index = OrderMachine.FLOW.indexOf(current);
    if (index === -1 || index === OrderMachine.FLOW.length - 1) return null;
    return OrderMachine.FLOW[index + 1];
  }

  static canTransition(from: OrderStatus, to: OrderStatus): boolean {
    if (to === "cancelled") return from === "received";
    return OrderMachine.next(from) === to;
  }

  static label(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      received: "Diterima",
      washing: "Dicuci",
      drying: "Dikeringkan",
      ironing: "Disetrika",
      ready: "Siap Diambil",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };
    return labels[status];
  }

  static filterOptions(): { value: string; label: string }[] {
    return [
      { value: "all", label: "Semua status" },
      ...OrderMachine.FLOW.concat("cancelled" as OrderStatus).map((status) => ({
        value: status,
        label: OrderMachine.label(status as OrderStatus),
      })),
    ];
  }

  static matchesQuery(order: Order, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      order.ticket.toLowerCase().includes(q) || order.customerName.toLowerCase().includes(q)
    );
  }

  static visible(orders: Order[], statusFilter: string, query: string): Order[] {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      return OrderMachine.matchesQuery(order, query);
    });
  }
}

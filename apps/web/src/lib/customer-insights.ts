import type { Customer, Order } from "@/lib/api/types";

export interface CustomerRow extends Customer {
  orderCount: number;
  lastOrderAt: string | null;
}

export class CustomerInsights {
  static summarize(customers: Customer[], orders: Order[], outletId: string): CustomerRow[] {
    const byCustomer = new Map<string, Order[]>();
    for (const order of orders) {
      const list = byCustomer.get(order.customerId) ?? [];
      list.push(order);
      byCustomer.set(order.customerId, list);
    }

    return customers
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
      });
  }

  static search(rows: CustomerRow[], query: string): CustomerRow[] {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q) || row.phone.includes(q));
  }
}

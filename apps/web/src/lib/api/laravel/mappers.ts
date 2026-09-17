import type {
  AppNotification,
  CashEntry,
  CashSummary,
  Customer,
  DashboardSummary,
  DeliveryTask,
  Order,
  OrderItem,
  OrderStatus,
  OrderStatusEvent,
  Outlet,
  PaymentMethod,
  PaymentStatus,
  PlanTier,
  ReportSummary,
  Service,
  Subscription,
  Tenant,
  TenantStatus,
  User,
} from "@/lib/api/types";
import type {
  WireAppNotification,
  WireCash,
  WireCashSummary,
  WireCustomer,
  WireDashboard,
  WireHistoryEvent,
  WireOrder,
  WireOrderItem,
  WireOutlet,
  WireReport,
  WireService,
  WireSubscription,
  WireTask,
  WireTenant,
  WireUser,
} from "@/lib/api/laravel/wire-types";

export class Mappers {
  static user(w: WireUser): User {
    return {
      id: String(w.id),
      tenantId: String(w.tenant_id),
      outletId: w.outlet_id === null ? "" : String(w.outlet_id),
      name: w.name,
      email: w.email,
      role: w.role as User["role"],
    };
  }

  static tenant(w: WireTenant): Tenant {
    return {
      id: String(w.id),
      name: w.name,
      plan: w.plan as PlanTier,
      status: w.status as TenantStatus,
    };
  }

  static outlet(w: WireOutlet, tenantId: string): Outlet {
    return {
      id: String(w.id),
      tenantId,
      code: w.code,
      name: w.name,
      address: w.address ?? "",
      phone: w.phone ?? "",
    };
  }

  static customer(w: WireCustomer, tenantId: string): Customer {
    return {
      id: String(w.id),
      tenantId,
      outletId: String(w.outlet_id),
      name: w.name,
      phone: w.phone,
      address: w.address ?? undefined,
      notes: w.notes ?? undefined,
      createdAt: "",
    };
  }

  static service(w: WireService, tenantId: string): Service {
    return {
      id: String(w.id),
      tenantId,
      outletId: null,
      name: w.name,
      unit: w.unit as Service["unit"],
      pricePerUnit: w.price_per_unit,
      estimatedHours: w.estimated_hours,
      active: w.active,
    };
  }

  static orderItem(w: WireOrderItem, orderId: string): OrderItem {
    return {
      id: String(w.id),
      orderId,
      serviceId: w.service_id === null ? "" : String(w.service_id),
      serviceName: w.service_name,
      unit: w.unit as OrderItem["unit"],
      qty: w.qty,
      unitPrice: w.unit_price,
      subtotal: w.subtotal,
      note: w.note ?? undefined,
    };
  }

  static historyEvent(w: WireHistoryEvent): OrderStatusEvent {
    return {
      status: w.status as OrderStatus,
      at: w.at ?? "",
      byUserId: "",
      byUserName: w.by_user ?? "Sistem",
      note: w.note ?? undefined,
    };
  }

  static order(w: WireOrder, tenantId: string): Order {
    const id = String(w.id);
    const items = w.items ?? [];
    const history = w.history ?? [];
    return {
      id,
      tenantId,
      outletId: String(w.outlet_id),
      ticket: w.ticket,
      customerId: String(w.customer.id),
      customerName: w.customer.name,
      customerPhone: w.customer.phone,
      items: items.map((item) => Mappers.orderItem(item, id)),
      note: w.note ?? undefined,
      pickupRequested: w.pickup_requested,
      deliveryRequested: w.delivery_requested,
      status: w.status as OrderStatus,
      paymentStatus: w.payment_status as PaymentStatus,
      paymentMethod: (w.payment_method ?? null) as PaymentMethod | null,
      paidAmount: w.paid_amount,
      total: w.total,
      createdAt: w.created_at ?? "",
      estimatedDoneAt: w.estimated_done_at ?? undefined,
      completedAt: w.completed_at ?? undefined,
      history: history.map(Mappers.historyEvent),
    };
  }

  static dashboard(w: WireDashboard): DashboardSummary {
    return {
      ordersToday: Number(w.orders_today),
      salesToday: Number(w.sales_today),
      outstanding: Number(w.outstanding),
      cashBalance: Number(w.cash_balance),
      workload: w.workload.map((row) => ({
        status: row.status as OrderStatus,
        count: Number(row.count),
      })),
      readyWaiting: w.ready_waiting.map((row) => ({
        ticket: row.ticket,
        customerName: row.customer_name,
        hoursWaiting: Number(row.hours_waiting),
      })),
    };
  }

  static task(w: WireTask, tenantId: string): DeliveryTask {
    return {
      id: String(w.id),
      tenantId,
      outletId: String(w.outlet_id),
      orderId: String(w.order.id),
      orderTicket: w.order.ticket,
      driverId: w.driver ? String(w.driver.id) : null,
      driverName: w.driver?.name ?? null,
      type: w.type as DeliveryTask["type"],
      scheduledAt: w.scheduled_at ?? "",
      address: w.address ?? "",
      notes: w.notes ?? undefined,
      status: w.status as DeliveryTask["status"],
      proofUrl: w.proof_url,
      completedAt: w.completed_at ?? undefined,
    };
  }

  static cash(w: WireCash): CashEntry {
    return {
      id: String(w.id),
      outletId: String(w.outlet_id),
      type: w.type as CashEntry["type"],
      category: w.category,
      amount: Number(w.amount),
      balanceImpact: Number(w.balance_impact),
      paymentMethod: (w.payment_method ?? null) as CashEntry["paymentMethod"],
      orderId: w.order_id === null ? undefined : String(w.order_id),
      note: w.note ?? undefined,
      occurredAt: w.occurred_at ?? "",
    };
  }

  static cashSummary(w: WireCashSummary): CashSummary {
    return {
      date: w.date,
      income: Number(w.income),
      expense: Number(w.expense),
      balance: Number(w.balance),
      closed: w.closed,
    };
  }

  static notification(w: WireAppNotification): AppNotification {
    return {
      id: w.id,
      type: w.type,
      title: w.title ?? "(tanpa judul)",
      body: w.body ?? "",
      readAt: w.read_at,
      createdAt: w.created_at ?? "",
    };
  }

  static report(w: WireReport): ReportSummary {
    return {
      from: w.from,
      to: w.to,
      revenueTotal: Number(w.revenue_total),
      ordersTotal: Number(w.orders_total),
      revenueByDay: w.revenue_by_day.map((row) => ({
        date: row.date,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      })),
      ordersByStatus: w.orders_by_status.map((row) => ({
        status: row.status as OrderStatus,
        count: Number(row.count),
      })),
      topServices: w.top_services.map((row) => ({
        name: row.name,
        qty: Number(row.qty),
        revenue: Number(row.revenue),
      })),
    };
  }

  static subscription(w: WireSubscription): Subscription {
    return {
      plan: w.plan as PlanTier,
      planLabel: w.plan_label,
      status: w.status as TenantStatus,
      limits: {
        outlets: Number(w.limits.outlets),
        users: Number(w.limits.users),
        orders_per_month: Number(w.limits.orders_per_month),
      },
      usage: {
        outlets: Number(w.usage.outlets),
        users: Number(w.usage.users),
        orders_this_month: Number(w.usage.orders_this_month),
      },
    };
  }
}

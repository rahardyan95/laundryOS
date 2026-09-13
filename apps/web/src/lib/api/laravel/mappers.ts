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

export interface WireUser {
  id: number;
  name: string;
  email: string;
  role: string;
  tenant_id: number;
  outlet_id: number | null;
}

export interface WireTenant {
  id: number;
  name: string;
  plan: string;
  status: string;
}

export interface WireOutlet {
  id: number;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface WireCustomer {
  id: number;
  outlet_id: number;
  name: string;
  phone: string;
  address: string | null;
  notes: string | null;
}

export interface WireService {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  estimated_hours: number;
  active: boolean;
}

export interface WireOrderItem {
  id: number;
  service_id: number | null;
  service_name: string;
  unit: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  note: string | null;
}

export interface WireHistoryEvent {
  from_status: string | null;
  status: string;
  at: string | null;
  by_user: string | null;
  note: string | null;
}

export interface WireOrder {
  id: number;
  ticket: string;
  outlet_id: number;
  customer: { id: number; name: string; phone: string };
  items: WireOrderItem[];
  history: WireHistoryEvent[];
  note: string | null;
  pickup_requested: boolean;
  delivery_requested: boolean;
  status: string;
  payment_status: string;
  payment_method: string | null;
  paid_amount: number;
  total: number;
  created_at: string | null;
  estimated_done_at: string | null;
  completed_at: string | null;
}

export interface WireDashboard {
  orders_today: number;
  sales_today: number;
  outstanding: number;
  cash_balance: number;
  workload: { status: string; count: number }[];
  ready_waiting: { ticket: string; customer_name: string; hours_waiting: number }[];
}

export interface WireTask {
  id: number;
  outlet_id: number;
  type: string;
  status: string;
  scheduled_at: string | null;
  address: string | null;
  notes: string | null;
  proof_url: string | null;
  completed_at: string | null;
  order: { id: number; ticket: string };
  driver: { id: number; name: string } | null;
}

export interface WireCash {
  id: number;
  outlet_id: number;
  type: string;
  category: string;
  amount: number;
  balance_impact: number;
  payment_method: string | null;
  order_id: number | null;
  note: string | null;
  occurred_at: string | null;
}

export interface WireCashSummary {
  date: string;
  income: number;
  expense: number;
  balance: number;
  closed: boolean;
}

export interface WireAppNotification {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string | null;
}

export interface WireReport {
  from: string;
  to: string;
  revenue_total: number;
  orders_total: number;
  revenue_by_day: { date: string; revenue: number | string; orders: number | string }[];
  orders_by_status: { status: string; count: number | string }[];
  top_services: { name: string; qty: number | string; revenue: number | string }[];
}

export interface WireSubscription {
  plan: string;
  plan_label: string;
  status: string;
  limits: { outlets: number; users: number; orders_per_month: number };
  usage: { outlets: number; users: number; orders_this_month: number };
}

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

import { ApiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { HttpClient } from "@/lib/api/laravel/http-client";
import {
  Mappers,
  type WireAppNotification,
  type WireCash,
  type WireCashSummary,
  type WireCustomer,
  type WireDashboard,
  type WireOrder,
  type WireOutlet,
  type WireReport,
  type WireService,
  type WireSubscription,
  type WireTask,
  type WireTenant,
  type WireUser,
} from "@/lib/api/laravel/mappers";
import type {
  AppNotification,
  CashEntry,
  CashSummary,
  CreateCashEntryInput,
  CreateDeliveryTaskInput,
  CreateOrderInput,
  CreateOutletInput,
  Customer,
  DashboardSummary,
  DeliveryTask,
  DeliveryTaskStatus,
  InviteUserInput,
  Order,
  OrderFilter,
  Outlet,
  ReportSummary,
  Service,
  SessionPayload,
  Subscription,
  TrackedOrder,
  UpsertCustomerInput,
  UpsertServiceInput,
  User,
} from "@/lib/api/types";
import { SessionManager } from "@/lib/api/session";

export class LaravelApiClient extends ApiClient {
  private readonly http: HttpClient;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
  ) {
    super();
    this.http = new HttpClient(baseUrl);
  }

  private tenantId(): string {
    return SessionManager.get()?.tenant.id ?? "";
  }

  private async me(): Promise<SessionPayload> {
    const res = await this.http.get<{
      user: WireUser;
      tenant: WireTenant;
      outlets: WireOutlet[];
    }>("/auth/me");
    const tenant = Mappers.tenant(res.tenant);
    return {
      user: Mappers.user(res.user),
      tenant,
      outlets: res.outlets.map((o) => Mappers.outlet(o, tenant.id)),
    };
  }

  async login(email: string, password: string): Promise<SessionPayload> {
    await this.http.csrf();
    await this.http.post<{ user: WireUser }>("/auth/login", { email, password });
    const payload = await this.me();
    SessionManager.set(payload);
    return payload;
  }

  async logout(): Promise<void> {
    try {
      await this.http.post("/auth/logout");
    } finally {
      SessionManager.clear();
    }
  }

  async getMe(): Promise<SessionPayload | null> {
    try {
      const payload = await this.me();
      SessionManager.set(payload);
      return payload;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        SessionManager.clear();
        return null;
      }
      throw error;
    }
  }

  async getOutlets(): Promise<Outlet[]> {
    const tenantId = this.tenantId();
    const outlets = await this.http.fetchAll<WireOutlet>("/outlets");
    return outlets.map((o) => Mappers.outlet(o, tenantId));
  }

  async getDashboardSummary(outletId?: string): Promise<DashboardSummary> {
    const params = outletId ? { outlet_id: outletId } : undefined;
    const res = await this.http.get<{ data: WireDashboard }>("/dashboard/summary", params);
    return Mappers.dashboard(res.data);
  }

  async listOrders(filter?: OrderFilter): Promise<Order[]> {
    const tenantId = this.tenantId();
    const params: Record<string, string> = {};
    if (filter?.outletId) params.outlet_id = filter.outletId;
    if (filter?.status) params.status = filter.status;
    if (filter?.q) params.q = filter.q;
    const orders = await this.http.fetchAll<WireOrder>("/orders", params);
    return orders.map((o) => Mappers.order(o, tenantId));
  }

  async getOrder(id: string): Promise<Order> {
    const res = await this.http.get<{ data: WireOrder }>(`/orders/${id}`);
    return Mappers.order(res.data, this.tenantId());
  }

  async createOrder(input: CreateOrderInput, actor: User): Promise<Order> {
    void actor;
    const res = await this.http.post<{ data: WireOrder }>("/orders", {
      outlet_id: Number(input.outletId),
      customer_id: Number(input.customerId),
      items: input.items.map((item) => ({
        service_id: Number(item.serviceId),
        qty: item.qty,
        note: item.note,
      })),
      note: input.note,
      pickup_requested: input.pickupRequested,
      delivery_requested: input.deliveryRequested,
      payment_method: input.paidAmount > 0 ? input.paymentMethod : null,
      paid_amount: input.paidAmount,
    });
    return Mappers.order(res.data, this.tenantId());
  }

  async advanceOrderStatus(id: string, actor: User, note?: string): Promise<Order> {
    void actor;
    const res = await this.http.post<{ data: WireOrder }>(`/orders/${id}/status`, { note });
    return Mappers.order(res.data, this.tenantId());
  }

  async cancelOrder(id: string, actor: User, note?: string): Promise<Order> {
    void actor;
    const res = await this.http.post<{ data: WireOrder }>(`/orders/${id}/cancel`, { note });
    return Mappers.order(res.data, this.tenantId());
  }

  async listCustomers(): Promise<Customer[]> {
    const tenantId = this.tenantId();
    const customers = await this.http.fetchAll<WireCustomer>("/customers");
    return customers.map((c) => Mappers.customer(c, tenantId));
  }

  async upsertCustomer(input: UpsertCustomerInput): Promise<Customer> {
    const tenantId = this.tenantId();
    if (input.id) {
      const res = await this.http.patch<{ data: WireCustomer }>(`/customers/${input.id}`, {
        name: input.name,
        phone: input.phone,
        address: input.address,
        notes: input.notes,
      });
      return Mappers.customer(res.data, tenantId);
    }
    const res = await this.http.post<{ data: WireCustomer }>("/customers", {
      outlet_id: Number(input.outletId),
      name: input.name,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
    });
    return Mappers.customer(res.data, tenantId);
  }

  async listServices(): Promise<Service[]> {
    const tenantId = this.tenantId();
    const services = await this.http.fetchAll<WireService>("/services");
    return services.map((s) => Mappers.service(s, tenantId));
  }

  async upsertService(input: UpsertServiceInput): Promise<Service> {
    const tenantId = this.tenantId();
    if (input.id) {
      const res = await this.http.patch<{ data: WireService }>(`/services/${input.id}`, {
        name: input.name,
        unit: input.unit,
        price_per_unit: input.pricePerUnit,
        estimated_hours: input.estimatedHours,
        active: input.active,
      });
      return Mappers.service(res.data, tenantId);
    }
    const res = await this.http.post<{ data: WireService }>("/services", {
      name: input.name,
      unit: input.unit,
      price_per_unit: input.pricePerUnit,
      estimated_hours: input.estimatedHours,
      active: input.active,
    });
    return Mappers.service(res.data, tenantId);
  }

  async listUsers(role?: string): Promise<User[]> {
    const users = await this.http.fetchAll<WireUser>(
      "/users",
      role ? { role } : undefined
    );
    return users.map(Mappers.user);
  }

  async listDeliveryTasks(): Promise<DeliveryTask[]> {
    const tenantId = this.tenantId();
    const tasks = await this.http.fetchAll<WireTask>("/delivery-tasks");
    return tasks.map((t) => Mappers.task(t, tenantId));
  }

  async createDeliveryTask(input: CreateDeliveryTaskInput): Promise<DeliveryTask> {
    const res = await this.http.post<{ data: WireTask }>("/delivery-tasks", {
      order_id: Number(input.orderId),
      type: input.type,
      scheduled_at: input.scheduledAt,
      address: input.address,
      notes: input.notes,
      driver_id: input.driverId ? Number(input.driverId) : null,
    });
    return Mappers.task(res.data, this.tenantId());
  }

  async advanceDeliveryTask(id: string, status: DeliveryTaskStatus): Promise<DeliveryTask> {
    const res = await this.http.post<{ data: WireTask }>(`/delivery-tasks/${id}/status`, {
      status,
    });
    return Mappers.task(res.data, this.tenantId());
  }

  async uploadDeliveryProof(id: string, file: File): Promise<DeliveryTask> {
    const form = new FormData();
    form.set("proof", file);
    const res = await this.http.postForm<{ data: WireTask }>(`/delivery-tasks/${id}/proof`, form);
    return Mappers.task(res.data, this.tenantId());
  }

  async listCashEntries(outletId?: string, date?: string): Promise<CashEntry[]> {
    const params: Record<string, string> = {};
    if (outletId) params.outlet_id = outletId;
    if (date) params.date = date;
    const entries = await this.http.fetchAll<WireCash>("/cash-entries", params);
    return entries.map(Mappers.cash);
  }

  async createCashEntry(input: CreateCashEntryInput): Promise<CashEntry> {
    const res = await this.http.post<{ data: WireCash }>("/cash-entries", {
      outlet_id: Number(input.outletId),
      type: input.type,
      category: input.category,
      amount: input.amount,
      payment_method: input.paymentMethod ?? null,
      note: input.note,
      occurred_at: input.occurredAt,
    });
    return Mappers.cash(res.data);
  }

  async getCashSummary(outletId: string, date?: string): Promise<CashSummary> {
    const params: Record<string, string> = { outlet_id: outletId };
    if (date) params.date = date;
    const res = await this.http.get<{ data: WireCashSummary }>("/cash-entries/summary", params);
    return Mappers.cashSummary(res.data);
  }

  async closeCash(outletId: string, date: string): Promise<void> {
    await this.http.post("/cash-entries/close", { outlet_id: Number(outletId), date });
  }

  async reopenCash(outletId: string, date: string): Promise<void> {
    await this.http.post("/cash-entries/reopen", { outlet_id: Number(outletId), date });
  }

  async listNotifications(): Promise<AppNotification[]> {
    const items = await this.http.fetchAll<WireAppNotification>("/notifications");
    return items.map(Mappers.notification);
  }

  async getUnreadCount(): Promise<number> {
    const res = await this.http.get<{ data: { unread: number } }>("/notifications/unread-count");
    return Number(res.data.unread);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.http.post(`/notifications/${id}/read`);
  }

  async getReportSummary(outletId?: string, from?: string, to?: string): Promise<ReportSummary> {
    const params: Record<string, string> = {};
    if (outletId) params.outlet_id = outletId;
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await this.http.get<{ data: WireReport }>("/reports/summary", params);
    return Mappers.report(res.data);
  }

  async downloadSalesCsv(outletId?: string, from?: string, to?: string): Promise<Blob> {
    const params: Record<string, string> = {};
    if (outletId) params.outlet_id = outletId;
    if (from) params.from = from;
    if (to) params.to = to;
    return this.http.download("/reports/sales.csv", params);
  }

  async getSubscription(): Promise<Subscription> {
    const res = await this.http.get<{ data: WireSubscription }>("/subscription");
    return Mappers.subscription(res.data);
  }

  async updateSubscription(plan: string): Promise<Subscription> {
    const res = await this.http.patch<{ data: WireSubscription }>("/subscription", { plan });
    const payload = await this.me();
    SessionManager.set(payload);
    return Mappers.subscription(res.data);
  }

  async createOutlet(input: CreateOutletInput): Promise<Outlet> {
    const tenantId = this.tenantId();
    const res = await this.http.post<{ data: WireOutlet }>("/outlets", {
      code: input.code,
      name: input.name,
      address: input.address,
      phone: input.phone,
    });
    return Mappers.outlet(res.data, tenantId);
  }

  async inviteUser(input: InviteUserInput): Promise<User> {
    const res = await this.http.post<{ data: WireUser }>("/users", {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      outlet_id: input.outletId ? Number(input.outletId) : null,
    });
    return Mappers.user(res.data);
  }

  async trackOrder(ticket: string, phone: string): Promise<TrackedOrder> {
    const res = await this.http.post<{
      data: {
        ticket: string;
        status: string;
        customer_name: string;
        items: { service_name: string; qty: number; unit: string }[];
        total: number;
        estimated_done_at: string | null;
        history: { status: string; at: string | null }[];
      };
    }>("/track", { ticket, phone });
    const data = res.data;
    return {
      ticket: data.ticket,
      status: data.status as TrackedOrder["status"],
      customerName: data.customer_name,
      items: data.items.map((item) => ({
        serviceName: item.service_name,
        qty: Number(item.qty),
        unit: item.unit,
      })),
      total: Number(data.total),
      estimatedDoneAt: data.estimated_done_at ?? undefined,
      history: data.history.map((event) => ({
        status: event.status as TrackedOrder["status"],
        at: event.at ?? "",
      })),
    };
  }
}

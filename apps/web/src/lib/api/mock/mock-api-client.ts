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
import { ApiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { InMemoryStore } from "@/lib/api/mock/store";
import { SessionManager } from "@/lib/api/session";

const globalForStore = globalThis as unknown as { __laundryStore?: InMemoryStore };

export class MockApiClient extends ApiClient {
  private readonly store: InMemoryStore;

  constructor(store?: InMemoryStore) {
    super();
    if (store) {
      this.store = store;
    } else {
      if (!globalForStore.__laundryStore) {
        globalForStore.__laundryStore = new InMemoryStore();
      }
      this.store = globalForStore.__laundryStore;
    }
  }

  async login(email: string, password: string): Promise<SessionPayload> {
    await this.networkDelay();
    const user = this.store.findUserByEmail(email);
    if (!user || password.length === 0) {
      throw new ApiError(401, "Email atau kata sandi salah.");
    }
    return {
      user,
      tenant: { id: "tnt-1", name: "LaundryOS Demo", plan: "growth", status: "trial" },
      outlets: this.store.outlets(),
    };
  }

  async getMe(): Promise<SessionPayload | null> {
    await this.networkDelay(40, 80);
    return SessionManager.get();
  }

  async logout(): Promise<void> {
    SessionManager.clear();
  }

  async getOutlets(): Promise<Outlet[]> {
    await this.networkDelay();
    return this.store.outlets();
  }

  async getDashboardSummary(outletId?: string): Promise<DashboardSummary> {
    await this.networkDelay();
    return this.store.dashboardSummary(outletId);
  }

  async listOrders(filter?: OrderFilter): Promise<Order[]> {
    await this.networkDelay();
    return this.store.orders(filter);
  }

  async getOrder(id: string): Promise<Order> {
    await this.networkDelay();
    const order = this.store.findOrder(id);
    if (!order) throw new ApiError(404, "Order tidak ditemukan.");
    return order;
  }

  async createOrder(input: CreateOrderInput, actor: User): Promise<Order> {
    await this.networkDelay(200, 400);
    return this.store.createOrder(input, actor);
  }

  async advanceOrderStatus(id: string, actor: User, note?: string): Promise<Order> {
    await this.networkDelay(150, 300);
    return this.store.advanceStatus(id, actor, note);
  }

  async cancelOrder(id: string, actor: User, note?: string): Promise<Order> {
    await this.networkDelay(150, 300);
    return this.store.cancelOrder(id, actor, note);
  }

  async listCustomers(): Promise<Customer[]> {
    await this.networkDelay();
    return this.store.customers();
  }

  async upsertCustomer(input: UpsertCustomerInput): Promise<Customer> {
    await this.networkDelay(150, 300);
    return this.store.upsertCustomer(input);
  }

  async listServices(): Promise<Service[]> {
    await this.networkDelay();
    return this.store.services();
  }

  async upsertService(input: UpsertServiceInput): Promise<Service> {
    await this.networkDelay(150, 300);
    return this.store.upsertService(input);
  }

  async listUsers(role?: string): Promise<User[]> {
    await this.networkDelay();
    return this.store.usersByRole(role);
  }

  async listDeliveryTasks(): Promise<DeliveryTask[]> {
    await this.networkDelay();
    return this.store.deliveryTasks();
  }

  async createDeliveryTask(input: CreateDeliveryTaskInput): Promise<DeliveryTask> {
    await this.networkDelay(200, 400);
    return this.store.createDeliveryTask(input);
  }

  async advanceDeliveryTask(id: string, status: DeliveryTaskStatus): Promise<DeliveryTask> {
    await this.networkDelay(150, 300);
    return this.store.advanceDeliveryTask(id, status);
  }

  async uploadDeliveryProof(id: string, _file: File): Promise<DeliveryTask> {
    void _file;
    await this.networkDelay(200, 400);
    return this.store.uploadDeliveryProof(id);
  }

  async listCashEntries(outletId?: string, date?: string): Promise<CashEntry[]> {
    await this.networkDelay();
    return this.store.cashEntries(outletId, date);
  }

  async createCashEntry(input: CreateCashEntryInput): Promise<CashEntry> {
    await this.networkDelay(200, 400);
    return this.store.createCashEntry(input);
  }

  async getCashSummary(outletId: string, date?: string): Promise<CashSummary> {
    await this.networkDelay();
    return this.store.cashSummary(outletId, date);
  }

  async closeCash(outletId: string, date: string): Promise<void> {
    await this.networkDelay(150, 300);
    this.store.closeCash(outletId, date);
  }

  async reopenCash(outletId: string, date: string): Promise<void> {
    await this.networkDelay(150, 300);
    this.store.reopenCash(outletId, date);
  }

  async listNotifications(): Promise<AppNotification[]> {
    await this.networkDelay();
    return this.store.notifications();
  }

  async getUnreadCount(): Promise<number> {
    await this.networkDelay(40, 80);
    return this.store.unreadCount();
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.networkDelay(40, 80);
    this.store.markNotificationRead(id);
  }

  async getReportSummary(outletId?: string, from?: string, to?: string): Promise<ReportSummary> {
    await this.networkDelay();
    return this.store.reportSummary(outletId, from, to);
  }

  async downloadSalesCsv(outletId?: string, from?: string, to?: string): Promise<Blob> {
    await this.networkDelay();
    return new Blob([this.store.salesCsv(outletId, from, to)], { type: "text/csv" });
  }

  async getSubscription(): Promise<Subscription> {
    await this.networkDelay();
    return this.store.subscription();
  }

  async updateSubscription(plan: string): Promise<Subscription> {
    await this.networkDelay(150, 300);
    if (plan !== "starter" && plan !== "growth" && plan !== "multi_outlet") {
      throw new ApiError(422, "Paket tidak valid.");
    }
    return this.store.updateSubscription(plan);
  }

  async createOutlet(input: CreateOutletInput): Promise<Outlet> {
    await this.networkDelay(200, 400);
    return this.store.createOutlet(input);
  }

  async inviteUser(input: InviteUserInput): Promise<User> {
    await this.networkDelay(200, 400);
    return this.store.inviteUser(input);
  }

  async trackOrder(ticket: string, phone: string): Promise<TrackedOrder> {
    await this.networkDelay(150, 300);
    return this.store.trackOrder(ticket, phone);
  }
}

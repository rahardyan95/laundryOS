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

export abstract class ApiClient {
  protected networkDelay(minMs = 120, maxMs = 320): Promise<void> {
    const ms = minMs + Math.random() * (maxMs - minMs);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  abstract login(email: string, password: string): Promise<SessionPayload>;
  abstract logout(): Promise<void>;
  abstract getMe(): Promise<SessionPayload | null>;
  abstract getOutlets(): Promise<Outlet[]>;
  abstract getDashboardSummary(outletId?: string): Promise<DashboardSummary>;
  abstract listOrders(filter?: OrderFilter): Promise<Order[]>;
  abstract getOrder(id: string): Promise<Order>;
  abstract createOrder(input: CreateOrderInput, actor: User): Promise<Order>;
  abstract advanceOrderStatus(id: string, actor: User, note?: string): Promise<Order>;
  abstract cancelOrder(id: string, actor: User, note?: string): Promise<Order>;
  abstract listCustomers(): Promise<Customer[]>;
  abstract upsertCustomer(input: UpsertCustomerInput): Promise<Customer>;
  abstract listServices(): Promise<Service[]>;
  abstract upsertService(input: UpsertServiceInput): Promise<Service>;

  abstract listUsers(role?: string): Promise<User[]>;
  abstract listDeliveryTasks(): Promise<DeliveryTask[]>;
  abstract createDeliveryTask(input: CreateDeliveryTaskInput): Promise<DeliveryTask>;
  abstract advanceDeliveryTask(id: string, status: DeliveryTaskStatus): Promise<DeliveryTask>;
  abstract uploadDeliveryProof(id: string, file: File): Promise<DeliveryTask>;
  abstract listCashEntries(outletId?: string, date?: string): Promise<CashEntry[]>;
  abstract createCashEntry(input: CreateCashEntryInput, actor: User): Promise<CashEntry>;
  abstract getCashSummary(outletId: string, date?: string): Promise<CashSummary>;
  abstract closeCash(outletId: string, date: string): Promise<void>;
  abstract reopenCash(outletId: string, date: string): Promise<void>;
  abstract listNotifications(): Promise<AppNotification[]>;
  abstract getUnreadCount(): Promise<number>;
  abstract markNotificationRead(id: string): Promise<void>;
  abstract getReportSummary(outletId?: string, from?: string, to?: string): Promise<ReportSummary>;
  abstract downloadSalesCsv(outletId?: string, from?: string, to?: string): Promise<Blob>;

  abstract getSubscription(): Promise<Subscription>;
  abstract createOutlet(input: CreateOutletInput): Promise<Outlet>;
  abstract inviteUser(input: InviteUserInput): Promise<User>;

  abstract trackOrder(ticket: string, phone: string): Promise<TrackedOrder>;
}

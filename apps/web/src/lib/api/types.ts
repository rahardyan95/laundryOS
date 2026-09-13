export type Role = "owner" | "manager" | "cashier" | "operator" | "driver";

export type OrderStatus =
  | "received"
  | "washing"
  | "drying"
  | "ironing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod = "cash" | "transfer" | "qris";
export type ServiceUnit = "kg" | "pcs" | "pasang";
export type PlanTier = "starter" | "growth" | "multi_outlet";
export type TenantStatus = "trial" | "active" | "past_due" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  plan: PlanTier;
  status: TenantStatus;
}

export interface Outlet {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
}

export interface User {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  tenantId: string;
  outletId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Service {
  id: string;
  tenantId: string;
  outletId: string | null;
  name: string;
  unit: ServiceUnit;
  pricePerUnit: number;
  estimatedHours: number;
  active: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  serviceId: string;
  serviceName: string;
  unit: ServiceUnit;
  qty: number;
  unitPrice: number;
  subtotal: number;
  note?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  byUserId: string;
  byUserName: string;
  note?: string;
}

export interface Order {
  id: string;
  tenantId: string;
  outletId: string;
  ticket: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  note?: string;
  pickupRequested: boolean;
  deliveryRequested: boolean;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paidAmount: number;
  total: number;
  createdAt: string;
  estimatedDoneAt?: string;
  completedAt?: string;
  history: OrderStatusEvent[];
}

export interface OrderFilter {
  outletId?: string;
  status?: OrderStatus;
  q?: string;
}

export interface CreateOrderInput {
  outletId: string;
  customerId: string;
  items: { serviceId: string; qty: number; note?: string }[];
  note?: string;
  pickupRequested: boolean;
  deliveryRequested: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
}

export interface UpsertCustomerInput {
  id?: string;
  outletId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface UpsertServiceInput {
  id?: string;
  name: string;
  unit: ServiceUnit;
  pricePerUnit: number;
  estimatedHours: number;
  active: boolean;
}

export interface DashboardSummary {
  ordersToday: number;
  salesToday: number;
  outstanding: number;
  cashBalance: number;
  workload: { status: OrderStatus; count: number }[];
  readyWaiting: { ticket: string; customerName: string; hoursWaiting: number }[];
}

export type DeliveryTaskStatus = "pending" | "assigned" | "in_progress" | "done" | "cancelled";
export type DeliveryTaskType = "pickup" | "delivery";

export interface DeliveryTask {
  id: string;
  tenantId: string;
  outletId: string;
  orderId: string;
  orderTicket: string;
  driverId: string | null;
  driverName: string | null;
  type: DeliveryTaskType;
  scheduledAt: string;
  address: string;
  notes?: string;
  status: DeliveryTaskStatus;
  proofUrl: string | null;
  completedAt?: string;
}

export interface CreateDeliveryTaskInput {
  orderId: string;
  type: DeliveryTaskType;
  scheduledAt: string;
  address?: string;
  notes?: string;
  driverId?: string;
}

export type CashEntryType = "income" | "expense";

export interface CashEntry {
  id: string;
  outletId: string;
  type: CashEntryType;
  category: string;
  amount: number;
  balanceImpact: number;
  paymentMethod: PaymentMethod | null;
  orderId?: string;
  note?: string;
  occurredAt: string;
}

export interface CreateCashEntryInput {
  outletId: string;
  type: CashEntryType;
  category: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  note?: string;
  occurredAt?: string;
}

export interface CashSummary {
  date: string;
  income: number;
  expense: number;
  balance: number;
  closed: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface ReportSummary {
  from: string;
  to: string;
  revenueTotal: number;
  ordersTotal: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  topServices: { name: string; qty: number; revenue: number }[];
}

export interface PlanLimits {
  outlets: number;
  users: number;
  orders_per_month: number;
}

export interface PlanUsage {
  outlets: number;
  users: number;
  orders_this_month: number;
}

export interface Subscription {
  plan: PlanTier;
  planLabel: string;
  status: TenantStatus;
  limits: PlanLimits;
  usage: PlanUsage;
}

export interface CreateOutletInput {
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface InviteUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  outletId?: string;
}

export interface TrackedOrderItem {
  serviceName: string;
  qty: number;
  unit: string;
}

export interface TrackedHistory {
  status: OrderStatus;
  at: string;
}

export interface TrackedOrder {
  ticket: string;
  status: OrderStatus;
  customerName: string;
  items: TrackedOrderItem[];
  total: number;
  estimatedDoneAt?: string;
  history: TrackedHistory[];
}

export interface SessionPayload {
  user: User;
  tenant: Tenant;
  outlets: Outlet[];
}

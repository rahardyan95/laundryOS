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

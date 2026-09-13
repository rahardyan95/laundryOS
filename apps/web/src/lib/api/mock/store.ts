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
  OrderItem,
  OrderStatus,
  Outlet,
  ReportSummary,
  Service,
  Subscription,
  TrackedOrder,
  UpsertCustomerInput,
  UpsertServiceInput,
  User,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/api-error";
import { OrderMachine } from "@/lib/order-machine";
import { Format } from "@/lib/format";

interface SeedOrderConfig {
  outletId: string;
  customer: Customer;
  items: { service: Service; qty: number }[];
  status: OrderStatus;
  createdAtHoursAgo: number;
  stepHours: number;
  paymentStatus: Order["paymentStatus"];
  paidAmount: number;
  note?: string;
}

export class InMemoryStore {
  private readonly tenantId = "tnt-1";

  private readonly outletList: Outlet[] = [
    {
      id: "olt-1",
      tenantId: this.tenantId,
      code: "KMG",
      name: "LaundryOS Kemang",
      address: "Jl. Kemang Raya No. 21, Jakarta Selatan",
      phone: "021-7199-2101",
    },
    {
      id: "olt-2",
      tenantId: this.tenantId,
      code: "TBT",
      name: "LaundryOS Tebet",
      address: "Jl. Tebet Raya No. 8, Jakarta Selatan",
      phone: "021-7199-2102",
    },
  ];

  private readonly userList: User[] = [
    {
      id: "usr-1",
      tenantId: this.tenantId,
      outletId: "olt-1",
      name: "Budi Santoso",
      email: "owner@laundryos.test",
      role: "owner",
    },
    {
      id: "usr-2",
      tenantId: this.tenantId,
      outletId: "olt-1",
      name: "Sari Dewi",
      email: "manager@laundryos.test",
      role: "manager",
    },
    {
      id: "usr-3",
      tenantId: this.tenantId,
      outletId: "olt-1",
      name: "Rina Amelia",
      email: "kasir@laundryos.test",
      role: "cashier",
    },
    {
      id: "usr-4",
      tenantId: this.tenantId,
      outletId: "olt-1",
      name: "Joko Prabowo",
      email: "operator@laundryos.test",
      role: "operator",
    },
    {
      id: "usr-5",
      tenantId: this.tenantId,
      outletId: "olt-2",
      name: "Andi Kurnia",
      email: "kasir.tbt@laundryos.test",
      role: "cashier",
    },
    {
      id: "usr-6",
      tenantId: this.tenantId,
      outletId: "olt-1",
      name: "Ketut Arya",
      email: "kurir@laundryos.test",
      role: "driver",
    },
  ];

  private customerList: Customer[] = [
    { id: "cst-1", tenantId: this.tenantId, outletId: "olt-1", name: "Dewi Lestari", phone: "0812-3345-6712", address: "Jl. Bangka IX No. 4", createdAt: this.iso(24 * 30) },
    { id: "cst-2", tenantId: this.tenantId, outletId: "olt-1", name: "Agus Prasetyo", phone: "0813-2299-1042", address: "Perumahan Kemang Timur Blok C2", createdAt: this.iso(24 * 21) },
    { id: "cst-3", tenantId: this.tenantId, outletId: "olt-1", name: "Putu Ayu Wulandari", phone: "0878-5561-3320", createdAt: this.iso(24 * 14) },
    { id: "cst-4", tenantId: this.tenantId, outletId: "olt-1", name: "Hendra Wijaya", phone: "0856-1102-8804", address: "Jl. Prapanca Raya No. 17", notes: "Seritanya jangan pakai pewangi kuat", createdAt: this.iso(24 * 10) },
    { id: "cst-5", tenantId: this.tenantId, outletId: "olt-1", name: "Ratna Kusuma", phone: "0812-8877-6610", createdAt: this.iso(24 * 6) },
    { id: "cst-6", tenantId: this.tenantId, outletId: "olt-2", name: "Fajar Nugroho", phone: "0821-4432-9187", createdAt: this.iso(24 * 5) },
    { id: "cst-7", tenantId: this.tenantId, outletId: "olt-1", name: "Intan Permata", phone: "0819-6654-2201", createdAt: this.iso(24 * 3) },
    { id: "cst-8", tenantId: this.tenantId, outletId: "olt-2", name: "Bayu Setiawan", phone: "0852-9911-4478", createdAt: this.iso(24 * 2) },
  ];

  private serviceList: Service[] = [
    { id: "svc-1", tenantId: this.tenantId, outletId: null, name: "Cuci Kering Reguler", unit: "kg", pricePerUnit: 7000, estimatedHours: 48, active: true },
    { id: "svc-2", tenantId: this.tenantId, outletId: null, name: "Cuci Setrika", unit: "kg", pricePerUnit: 11000, estimatedHours: 48, active: true },
    { id: "svc-3", tenantId: this.tenantId, outletId: null, name: "Setrika Saja", unit: "kg", pricePerUnit: 6000, estimatedHours: 24, active: true },
    { id: "svc-4", tenantId: this.tenantId, outletId: null, name: "Cuci Kilat 6 Jam", unit: "kg", pricePerUnit: 16000, estimatedHours: 6, active: true },
    { id: "svc-5", tenantId: this.tenantId, outletId: null, name: "Cuci Sepatu", unit: "pasang", pricePerUnit: 30000, estimatedHours: 72, active: true },
    { id: "svc-6", tenantId: this.tenantId, outletId: null, name: "Bed Cover Besar", unit: "pcs", pricePerUnit: 45000, estimatedHours: 72, active: false },
  ];

  private orderList: Order[] = [];

  private taskList: DeliveryTask[] = [];

  private cashEntryList: CashEntry[] = [];

  private closingList: { outletId: string; date: string }[] = [];

  private notificationList: AppNotification[] = [];

  constructor() {
    this.orderList = [
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[0], items: [{ service: this.serviceList[1], qty: 4.5 }], status: "washing", createdAtHoursAgo: 6, stepHours: 2, paymentStatus: "paid", paidAmount: 49500 }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[1], items: [{ service: this.serviceList[0], qty: 3 }, { service: this.serviceList[4], qty: 1 }], status: "drying", createdAtHoursAgo: 8, stepHours: 2, paymentStatus: "partial", paidAmount: 25000, note: "Sepatu putih jangan disikat kasar" }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[2], items: [{ service: this.serviceList[3], qty: 2.5 }], status: "ready", createdAtHoursAgo: 26, stepHours: 2, paymentStatus: "paid", paidAmount: 40000 }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[3], items: [{ service: this.serviceList[2], qty: 5 }], status: "ironing", createdAtHoursAgo: 30, stepHours: 3, paymentStatus: "unpaid", paidAmount: 0, note: "Kemeja kerja dipisah" }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[4], items: [{ service: this.serviceList[0], qty: 6 }], status: "received", createdAtHoursAgo: 2, stepHours: 2, paymentStatus: "unpaid", paidAmount: 0 }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[0], items: [{ service: this.serviceList[1], qty: 3.2 }], status: "completed", createdAtHoursAgo: 52, stepHours: 10, paymentStatus: "paid", paidAmount: 35200 }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[2], items: [{ service: this.serviceList[5], qty: 1 }], status: "completed", createdAtHoursAgo: 76, stepHours: 12, paymentStatus: "paid", paidAmount: 45000 }),
      this.seedOrder({ outletId: "olt-1", customer: this.customerList[1], items: [{ service: this.serviceList[0], qty: 4 }], status: "completed", createdAtHoursAgo: 100, stepHours: 12, paymentStatus: "paid", paidAmount: 28000 }),
      this.seedOrder({ outletId: "olt-2", customer: this.customerList[5], items: [{ service: this.serviceList[1], qty: 5.5 }], status: "washing", createdAtHoursAgo: 4, stepHours: 2, paymentStatus: "paid", paidAmount: 60500 }),
      this.seedOrder({ outletId: "olt-2", customer: this.customerList[7], items: [{ service: this.serviceList[3], qty: 1.8 }], status: "ready", createdAtHoursAgo: 30, stepHours: 2, paymentStatus: "paid", paidAmount: 28800 }),
      this.seedOrder({ outletId: "olt-2", customer: this.customerList[6], items: [{ service: this.serviceList[0], qty: 2.2 }], status: "received", createdAtHoursAgo: 1, stepHours: 2, paymentStatus: "unpaid", paidAmount: 0 }),
      this.seedOrder({ outletId: "olt-2", customer: this.customerList[5], items: [{ service: this.serviceList[4], qty: 1 }], status: "cancelled", createdAtHoursAgo: 48, stepHours: 4, paymentStatus: "unpaid", paidAmount: 0, note: "Customer membatalkan sebelum diproses" }),
    ];
    this.normalizeSeedIdentities();
    this.seedOperations();
  }

  private normalizeSeedIdentities(): void {
    const counters = new Map<string, number>();
    this.orderList.forEach((order, index) => {
      order.id = `ord-seed-${index + 1}`;
      const outlet = this.outletById(order.outletId);
      const prefix = outlet?.code ?? "XX";
      const date = new Date();
      const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
      const seq = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, seq);
      order.ticket = `${prefix}-${stamp}-${String(seq).padStart(3, "0")}`;
      order.items.forEach((item, itemIndex) => {
        item.id = `itm-seed-${index + 1}-${itemIndex + 1}`;
        item.orderId = order.id;
      });
    });
  }

  private iso(hoursAgo: number): string {
    return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  }

  private ticketFor(outlet: Outlet): string {
    const prefix = outlet.code;
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const todayCount = this.orderList.filter(
      (o) => o.outletId === outlet.id && o.ticket.startsWith(`${prefix}-${stamp}`)
    ).length;
    return `${prefix}-${stamp}-${String(todayCount + 1).padStart(3, "0")}`;
  }

  private seedOrder(cfg: SeedOrderConfig): Order {
    const outlet = this.outletList.find((o) => o.id === cfg.outletId)!;
    const items: OrderItem[] = cfg.items.map((entry, index) => ({
      id: `itm-${Date.now()}-${index}`,
      orderId: "",
      serviceId: entry.service.id,
      serviceName: entry.service.name,
      unit: entry.service.unit,
      qty: entry.qty,
      unitPrice: entry.service.pricePerUnit,
      subtotal: Math.round(entry.qty * entry.service.pricePerUnit),
    }));
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const flowIndex = OrderMachine.FLOW.indexOf(cfg.status);
    const history = [];
    if (cfg.status === "cancelled") {
      history.push(
        { status: "received" as OrderStatus, at: this.iso(cfg.createdAtHoursAgo), byUserId: "usr-3", byUserName: "Rina Amelia" },
        { status: "cancelled" as OrderStatus, at: this.iso(cfg.createdAtHoursAgo - cfg.stepHours), byUserId: "usr-1", byUserName: "Budi Santoso", note: "Dibatalkan oleh owner" }
      );
    } else {
      for (let i = 0; i <= flowIndex; i++) {
        history.push({
          status: OrderMachine.FLOW[i],
          at: this.iso(cfg.createdAtHoursAgo - i * cfg.stepHours),
          byUserId: i === 0 ? "usr-3" : "usr-4",
          byUserName: i === 0 ? "Rina Amelia" : "Joko Prabowo",
        });
      }
    }
    const createdAt = this.iso(cfg.createdAtHoursAgo);
    return {
      id: `ord-${this.orderList.length + 1}-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: cfg.outletId,
      ticket: this.ticketFor(outlet),
      customerId: cfg.customer.id,
      customerName: cfg.customer.name,
      customerPhone: cfg.customer.phone,
      items,
      note: cfg.note,
      pickupRequested: false,
      deliveryRequested: false,
      status: cfg.status,
      paymentStatus: cfg.paymentStatus,
      paymentMethod: cfg.paymentStatus === "unpaid" ? null : "cash",
      paidAmount: cfg.paidAmount,
      total,
      createdAt,
      estimatedDoneAt: cfg.items[0]?.service.estimatedHours
        ? new Date(new Date(createdAt).getTime() + cfg.items[0].service.estimatedHours * 3_600_000).toISOString()
        : undefined,
      completedAt: cfg.status === "completed" ? history[history.length - 1].at : undefined,
      history,
    };
  }

  outlets(): Outlet[] {
    return [...this.outletList];
  }

  outletById(id: string): Outlet | undefined {
    return this.outletList.find((o) => o.id === id);
  }

  users(): User[] {
    return [...this.userList];
  }

  findUserByEmail(email: string): User | undefined {
    return this.userList.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  customers(): Customer[] {
    return [...this.customerList].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  upsertCustomer(input: UpsertCustomerInput): Customer {
    if (input.id) {
      const existing = this.customerList.find((c) => c.id === input.id);
      if (!existing) throw new ApiError(404, "Pelanggan tidak ditemukan.");
      existing.name = input.name;
      existing.phone = input.phone;
      existing.address = input.address;
      existing.notes = input.notes;
      return existing;
    }
    const created: Customer = {
      id: `cst-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: input.outletId,
      name: input.name,
      phone: input.phone,
      address: input.address,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    this.customerList.push(created);
    return created;
  }

  services(): Service[] {
    return [...this.serviceList];
  }

  upsertService(input: UpsertServiceInput): Service {
    if (input.id) {
      const existing = this.serviceList.find((s) => s.id === input.id);
      if (!existing) throw new ApiError(404, "Layanan tidak ditemukan.");
      Object.assign(existing, input);
      return existing;
    }
    const created: Service = {
      id: `svc-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: null,
      ...input,
    };
    this.serviceList.push(created);
    return created;
  }

  orders(filter?: OrderFilter): Order[] {
    let result = [...this.orderList];
    if (filter?.outletId) result = result.filter((o) => o.outletId === filter.outletId);
    if (filter?.status) result = result.filter((o) => o.status === filter.status);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      result = result.filter(
        (o) => o.ticket.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findOrder(id: string): Order | undefined {
    return this.orderList.find((o) => o.id === id);
  }

  createOrder(input: CreateOrderInput, actor: User): Order {
    if (input.items.length === 0) throw new ApiError(422, "Order minimal memiliki satu layanan.");
    const outlet = this.outletById(input.outletId);
    if (!outlet) throw new ApiError(404, "Outlet tidak ditemukan.");
    const customer = this.customerList.find((c) => c.id === input.customerId);
    if (!customer) throw new ApiError(404, "Pelanggan tidak ditemukan.");

    const items: OrderItem[] = input.items.map((entry, index) => {
      const service = this.serviceList.find((s) => s.id === entry.serviceId);
      if (!service || !service.active) throw new ApiError(422, "Layanan tidak tersedia.");
      return {
        id: `itm-${Date.now()}-${index}`,
        orderId: "",
        serviceId: service.id,
        serviceName: service.name,
        unit: service.unit,
        qty: entry.qty,
        unitPrice: service.pricePerUnit,
        subtotal: Math.round(entry.qty * service.pricePerUnit),
        note: entry.note,
      };
    });
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (input.paidAmount > total) {
      throw new ApiError(422, "Nominal dibayar tidak boleh melebihi total order.");
    }
    const now = new Date().toISOString();
    const order: Order = {
      id: `ord-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: input.outletId,
      ticket: this.ticketFor(outlet),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items,
      note: input.note,
      pickupRequested: input.pickupRequested,
      deliveryRequested: input.deliveryRequested,
      status: "received",
      paymentStatus: input.paidAmount >= total ? "paid" : input.paidAmount > 0 ? "partial" : "unpaid",
      paymentMethod: input.paidAmount > 0 ? input.paymentMethod : null,
      paidAmount: input.paidAmount,
      total,
      createdAt: now,
      estimatedDoneAt: items[0]
        ? new Date(Date.now() + (this.serviceList.find((s) => s.id === items[0].serviceId)?.estimatedHours ?? 48) * 3_600_000).toISOString()
        : undefined,
      history: [
        { status: "received", at: now, byUserId: actor.id, byUserName: actor.name },
      ],
    };
    this.orderList.push(order);
    this.pushOrderNotification(order, "received");
    return order;
  }

  advanceStatus(id: string, actor: User, note?: string): Order {
    const order = this.findOrder(id);
    if (!order) throw new ApiError(404, "Order tidak ditemukan.");
    const next = OrderMachine.next(order.status);
    if (!next) throw new ApiError(422, `Order ${order.ticket} sudah pada status akhir.`);
    if (!OrderMachine.canTransition(order.status, next)) {
      throw new ApiError(422, `Transisi status tidak sah: ${OrderMachine.label(order.status)} → ${OrderMachine.label(next)}.`);
    }
    const now = new Date().toISOString();
    order.status = next;
    order.history.push({ status: next, at: now, byUserId: actor.id, byUserName: actor.name, note });
    if (next === "completed") order.completedAt = now;
    this.pushOrderNotification(order, next);
    return order;
  }

  cancelOrder(id: string, actor: User, note?: string): Order {
    const order = this.findOrder(id);
    if (!order) throw new ApiError(404, "Order tidak ditemukan.");
    if (!OrderMachine.canTransition(order.status, "cancelled")) {
      throw new ApiError(422, "Order hanya dapat dibatalkan sebelum diproses (status Diterima).");
    }
    const now = new Date().toISOString();
    order.status = "cancelled";
    order.history.push({ status: "cancelled", at: now, byUserId: actor.id, byUserName: actor.name, note });
    return order;
  }

  dashboardSummary(outletId?: string): DashboardSummary {
    const scoped = this.orders({ outletId }).filter((o) => o.status !== "cancelled");
    const today = scoped.filter((o) => Format.isSameDay(o.createdAt));
    const workload = OrderMachine.FLOW.filter((s) => s !== "completed").map((status) => ({
      status: status as OrderStatus,
      count: scoped.filter((o) => o.status === status).length,
    }));
    const readyWaiting = scoped
      .filter((o) => o.status === "ready")
      .map((o) => {
        const readyEvent = [...o.history].reverse().find((h) => h.status === "ready");
        const hoursWaiting = readyEvent
          ? Math.round((Date.now() - new Date(readyEvent.at).getTime()) / 3_600_000)
          : 0;
        return { ticket: o.ticket, customerName: o.customerName, hoursWaiting };
      })
      .filter((r) => r.hoursWaiting >= 12);
    return {
      ordersToday: today.length,
      salesToday: today.reduce((sum, o) => sum + o.total, 0),
      outstanding: scoped.reduce((sum, o) => sum + (o.total - o.paidAmount), 0),
      cashBalance: this.cashEntryList
        .filter((entry) => !outletId || entry.outletId === outletId)
        .reduce((sum, entry) => sum + entry.balanceImpact, 0),
      workload,
      readyWaiting,
    };
  }

  private static todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private static taskNext(status: DeliveryTaskStatus): DeliveryTaskStatus | null {
    if (status === "pending") return "assigned";
    if (status === "assigned") return "in_progress";
    if (status === "in_progress") return "done";
    return null;
  }

  private seedOperations(): void {
    const firstOrder = this.orderList[0];
    const tomorrow = new Date(Date.now() + 24 * 3_600_000).toISOString();
    this.taskList = [
      {
        id: "tsk-1",
        tenantId: this.tenantId,
        outletId: firstOrder.outletId,
        orderId: firstOrder.id,
        orderTicket: firstOrder.ticket,
        driverId: "usr-6",
        driverName: "Ketut Arya",
        type: "pickup",
        scheduledAt: tomorrow,
        address: "Jl. Bangka IX No. 4",
        status: "assigned",
        proofUrl: null,
      },
      {
        id: "tsk-2",
        tenantId: this.tenantId,
        outletId: firstOrder.outletId,
        orderId: firstOrder.id,
        orderTicket: firstOrder.ticket,
        driverId: null,
        driverName: null,
        type: "delivery",
        scheduledAt: tomorrow,
        address: "Perumahan Kemang Timur Blok C2",
        status: "pending",
        proofUrl: null,
      },
    ];

    const today = InMemoryStore.todayStr();
    this.cashEntryList = [
      {
        id: "csh-1",
        outletId: "olt-1",
        type: "income",
        category: "Laundry",
        amount: 250000,
        balanceImpact: 250000,
        paymentMethod: "cash",
        note: "Setoran pagi",
        occurredAt: today,
      },
      {
        id: "csh-2",
        outletId: "olt-1",
        type: "expense",
        category: "Deterjen",
        amount: 45000,
        balanceImpact: -45000,
        paymentMethod: "cash",
        occurredAt: today,
      },
    ];

    this.notificationList = [
      {
        id: "ntf-1",
        type: "OrderNotification",
        title: `Cucian siap diambil (${firstOrder.ticket})`,
        body: `${firstOrder.customerName} · hubungi untuk pengambilan`,
        readAt: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: "ntf-2",
        type: "OrderNotification",
        title: `Order baru ${firstOrder.ticket}`,
        body: `${firstOrder.customerName} · order tercatat`,
        readAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3_600_000).toISOString(),
      },
    ];
  }

  usersByRole(role?: string): User[] {
    if (!role) return this.users();
    return this.users().filter((u) => u.role === role);
  }

  deliveryTasks(): DeliveryTask[] {
    return [...this.taskList].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  createDeliveryTask(input: CreateDeliveryTaskInput): DeliveryTask {
    const order = this.orderList.find((o) => o.id === input.orderId);
    if (!order) throw new ApiError(404, "Order tidak ditemukan.");
    const scheduled = new Date(input.scheduledAt).getTime();
    if (!input.scheduledAt || Number.isNaN(scheduled) || scheduled <= Date.now()) {
      throw new ApiError(422, "Jadwal harus di masa depan.");
    }
    const driver = input.driverId
      ? this.userList.find((u) => u.id === input.driverId)
      : undefined;
    const task: DeliveryTask = {
      id: `tsk-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: order.outletId,
      orderId: order.id,
      orderTicket: order.ticket,
      driverId: driver?.id ?? null,
      driverName: driver?.name ?? null,
      type: input.type,
      scheduledAt: input.scheduledAt,
      address: input.address ?? "",
      notes: input.notes,
      status: driver ? "assigned" : "pending",
      proofUrl: null,
    };
    this.taskList.push(task);
    return task;
  }

  advanceDeliveryTask(id: string, target: DeliveryTaskStatus): DeliveryTask {
    const task = this.taskList.find((t) => t.id === id);
    if (!task) throw new ApiError(404, "Task tidak ditemukan.");
    const cancellable = task.status === "pending" || task.status === "assigned";
    if (target === "cancelled") {
      if (!cancellable) throw new ApiError(422, "Task tidak dapat dibatalkan pada status ini.");
    } else if (InMemoryStore.taskNext(task.status) !== target) {
      throw new ApiError(422, "Transisi task tidak sah.");
    }
    task.status = target;
    if (target === "done") task.completedAt = new Date().toISOString();
    return task;
  }

  uploadDeliveryProof(id: string): DeliveryTask {
    const task = this.taskList.find((t) => t.id === id);
    if (!task) throw new ApiError(404, "Task tidak ditemukan.");
    task.proofUrl = `mock://proofs/${id}.jpg`;
    return task;
  }

  cashEntries(outletId?: string, date?: string): CashEntry[] {
    return this.cashEntryList.filter(
      (e) => (!outletId || e.outletId === outletId) && (!date || e.occurredAt === date)
    );
  }

  createCashEntry(input: CreateCashEntryInput): CashEntry {
    const occurredAt = input.occurredAt ?? InMemoryStore.todayStr();
    if (this.closingList.some((c) => c.outletId === input.outletId && c.date === occurredAt)) {
      throw new ApiError(422, "Kas tanggal tersebut sudah ditutup.");
    }
    const entry: CashEntry = {
      id: `csh-${Date.now()}`,
      outletId: input.outletId,
      type: input.type,
      category: input.category,
      amount: input.amount,
      balanceImpact: input.type === "income" ? input.amount : -input.amount,
      paymentMethod: input.paymentMethod ?? null,
      note: input.note,
      occurredAt,
    };
    this.cashEntryList.push(entry);
    return entry;
  }

  cashSummary(outletId: string, date?: string): CashSummary {
    const day = date ?? InMemoryStore.todayStr();
    const entries = this.cashEntries(outletId, day);
    const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return {
      date: day,
      income,
      expense,
      balance: income - expense,
      closed: this.closingList.some((c) => c.outletId === outletId && c.date === day),
    };
  }

  closeCash(outletId: string, date: string): void {
    if (this.closingList.some((c) => c.outletId === outletId && c.date === date)) {
      throw new ApiError(422, "Kas tanggal tersebut sudah ditutup.");
    }
    this.closingList.push({ outletId, date });
  }

  reopenCash(outletId: string, date: string): void {
    const index = this.closingList.findIndex((c) => c.outletId === outletId && c.date === date);
    if (index === -1) throw new ApiError(404, "Tutup kas tidak ditemukan.");
    this.closingList.splice(index, 1);
  }

  notifications(): AppNotification[] {
    return [...this.notificationList].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  unreadCount(): number {
    return this.notificationList.filter((n) => n.readAt === null).length;
  }

  markNotificationRead(id: string): void {
    const item = this.notificationList.find((n) => n.id === id);
    if (!item) throw new ApiError(404, "Notifikasi tidak ditemukan.");
    item.readAt = new Date().toISOString();
  }

  private pushOrderNotification(order: Order, status: OrderStatus): void {
    const label = OrderMachine.label(status);
    this.notificationList.push({
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "OrderNotification",
      title:
        status === "ready"
          ? `Cucian siap diambil (${order.ticket})`
          : `Order ${order.ticket} · ${label}`,
      body: `${order.customerName} · ${label}`,
      readAt: null,
      createdAt: new Date().toISOString(),
    });
  }

  reportSummary(outletId?: string, from?: string, to?: string): ReportSummary {
    const toDate = to ?? InMemoryStore.todayStr();
    const fromDate = from ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    const scoped = this.orderList.filter(
      (o) =>
        o.status !== "cancelled" &&
        (!outletId || o.outletId === outletId) &&
        o.createdAt.slice(0, 10) >= fromDate &&
        o.createdAt.slice(0, 10) <= toDate
    );
    const byDay = new Map<string, { revenue: number; orders: number }>();
    for (const order of scoped) {
      const day = order.createdAt.slice(0, 10);
      const row = byDay.get(day) ?? { revenue: 0, orders: 0 };
      row.revenue += order.total;
      row.orders += 1;
      byDay.set(day, row);
    }
    const byStatus = new Map<OrderStatus, number>();
    for (const order of scoped) {
      byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    }
    const services = new Map<string, { qty: number; revenue: number }>();
    for (const order of scoped) {
      for (const item of order.items) {
        const row = services.get(item.serviceName) ?? { qty: 0, revenue: 0 };
        row.qty += item.qty;
        row.revenue += item.subtotal;
        services.set(item.serviceName, row);
      }
    }
    return {
      from: fromDate,
      to: toDate,
      revenueTotal: scoped.reduce((s, o) => s + o.total, 0),
      ordersTotal: scoped.length,
      revenueByDay: [...byDay.entries()]
        .map(([date, row]) => ({ date, ...row }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      ordersByStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
      topServices: [...services.entries()]
        .map(([name, row]) => ({ name, ...row }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };
  }

  salesCsv(outletId?: string, from?: string, to?: string): string {
    const toDate = to ?? InMemoryStore.todayStr();
    const fromDate = from ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
    const scoped = this.orderList.filter(
      (o) =>
        o.status !== "cancelled" &&
        (!outletId || o.outletId === outletId) &&
        o.createdAt.slice(0, 10) >= fromDate &&
        o.createdAt.slice(0, 10) <= toDate
    );
    const lines = ["ticket,tanggal,pelanggan,isi,total,dibayar,status,pembayaran"];
    for (const order of scoped) {
      const items = order.items.map((i) => `${i.serviceName} ${i.qty}${i.unit}`).join(" | ");
      lines.push(
        [order.ticket, order.createdAt.slice(0, 16).replace("T", " "), `"${order.customerName}"`, `"${items}"`, order.total, order.paidAmount, order.status, order.paymentStatus].join(",")
      );
    }
    return lines.join("\n");
  }

  private mockPlan: "starter" | "growth" | "multi_outlet" = "growth";

  private static readonly PLAN_LIMITS = {
    starter: { label: "Starter", outlets: 1, users: 3, orders_per_month: 500 },
    growth: { label: "Growth", outlets: 3, users: 10, orders_per_month: 2000 },
    multi_outlet: { label: "Multi-Outlet", outlets: 10, users: 50, orders_per_month: 10000 },
  } as const;

  subscription(): Subscription {
    const limits = InMemoryStore.PLAN_LIMITS[this.mockPlan];
    const month = InMemoryStore.todayStr().slice(0, 7);
    return {
      plan: this.mockPlan,
      planLabel: limits.label,
      status: "active",
      limits: { outlets: limits.outlets, users: limits.users, orders_per_month: limits.orders_per_month },
      usage: {
        outlets: this.outletList.length,
        users: this.userList.length,
        orders_this_month: this.orderList.filter((o) => o.createdAt.slice(0, 7) === month).length,
      },
    };
  }

  updateSubscription(plan: "starter" | "growth" | "multi_outlet"): Subscription {
    this.mockPlan = plan;
    return this.subscription();
  }

  createOutlet(input: CreateOutletInput): Outlet {
    const sub = this.subscription();
    if (sub.usage.outlets >= sub.limits.outlets) {
      throw new ApiError(422, `Batas outlet paket ${sub.planLabel} tercapai.`);
    }
    if (this.outletList.some((o) => o.code === input.code)) {
      throw new ApiError(422, "Kode outlet sudah dipakai.");
    }
    const outlet: Outlet = {
      id: `olt-${Date.now()}`,
      tenantId: this.tenantId,
      code: input.code,
      name: input.name,
      address: input.address ?? "",
      phone: input.phone ?? "",
    };
    (this.outletList as Outlet[]).push(outlet);
    return outlet;
  }

  inviteUser(input: InviteUserInput): User {
    const sub = this.subscription();
    if (sub.usage.users >= sub.limits.users) {
      throw new ApiError(422, `Batas pengguna paket ${sub.planLabel} tercapai.`);
    }
    if (this.userList.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiError(422, "Email sudah terdaftar.");
    }
    const user: User = {
      id: `usr-${Date.now()}`,
      tenantId: this.tenantId,
      outletId: input.outletId ?? "",
      name: input.name,
      email: input.email,
      role: input.role,
    };
    (this.userList as User[]).push(user);
    return user;
  }

  trackOrder(ticket: string, phone: string): TrackedOrder {
    const digits = (value: string) => value.replace(/\D/g, "");
    const order = this.orderList.find(
      (o) => o.ticket.toLowerCase() === ticket.trim().toLowerCase()
    );
    if (!order || digits(order.customerPhone) !== digits(phone)) {
      throw new ApiError(404, "Order tidak ditemukan. Periksa nomor ticket dan telepon.");
    }
    return {
      ticket: order.ticket,
      status: order.status,
      customerName: order.customerName,
      items: order.items.map((item) => ({
        serviceName: item.serviceName,
        qty: item.qty,
        unit: item.unit,
      })),
      total: order.total,
      estimatedDoneAt: order.estimatedDoneAt,
      history: order.history.map((event) => ({ status: event.status, at: event.at })),
    };
  }
}

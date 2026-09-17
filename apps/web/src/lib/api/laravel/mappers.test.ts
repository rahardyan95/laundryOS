import { describe, expect, it } from "vitest";
import { Mappers } from "@/lib/api/laravel/mappers";
import type {
  WireDashboard,
  WireOrder,
  WireReport,
  WireUser,
} from "@/lib/api/laravel/wire-types";

const wireUser: WireUser = {
  id: 7,
  name: "Budi Santoso",
  email: "owner@laundryos.test",
  role: "owner",
  tenant_id: 1,
  outlet_id: 2,
};

describe("Mappers", () => {
  it("user: id numerik menjadi string", () => {
    const user = Mappers.user(wireUser);
    expect(user).toMatchObject({
      id: "7",
      tenantId: "1",
      outletId: "2",
      role: "owner",
    });
  });

  it("user: outlet null menjadi string kosong", () => {
    expect(Mappers.user({ ...wireUser, outlet_id: null }).outletId).toBe("");
  });

  it("outlet memakai tenantId dari konteks sesi", () => {
    const outlet = Mappers.outlet(
      { id: 3, code: "KMG", name: "Kemang", address: null, phone: null },
      "tnt-9"
    );
    expect(outlet).toMatchObject({ id: "3", tenantId: "tnt-9", address: "" });
  });

  it("order memetakan snake_case + relasi + history", () => {
    const wire: WireOrder = {
      id: 11,
      ticket: "KMG-20260904-001",
      outlet_id: 2,
      customer: { id: 5, name: "Dewi Lestari", phone: "0812" },
      items: [
        {
          id: 21,
          service_id: 9,
          service_name: "Cuci Setrika",
          unit: "kg",
          qty: 2.5,
          unit_price: 11000,
          subtotal: 27500,
          note: null,
        },
      ],
      history: [
        { from_status: null, status: "received", at: "2026-09-04T01:00:00Z", by_user: "Rina Amelia", note: null },
      ],
      note: null,
      pickup_requested: false,
      delivery_requested: false,
      status: "received",
      payment_status: "paid",
      payment_method: "cash",
      paid_amount: 27500,
      total: 27500,
      created_at: "2026-09-04T01:00:00Z",
      estimated_done_at: null,
      completed_at: null,
    };
    const order = Mappers.order(wire, "tnt-1");
    expect(order).toMatchObject({
      id: "11",
      tenantId: "tnt-1",
      outletId: "2",
      customerId: "5",
      customerName: "Dewi Lestari",
      status: "received",
    });
    expect(order.items[0]).toMatchObject({
      orderId: "11",
      serviceId: "9",
      qty: 2.5,
    });
    expect(order.history[0]).toMatchObject({
      status: "received",
      byUserName: "Rina Amelia",
    });
  });

  it("history memakai default jujur bila null", () => {
    const event = Mappers.historyEvent({
      from_status: null,
      status: "washing",
      at: null,
      by_user: null,
      note: null,
    });
    expect(event).toMatchObject({ at: "", byUserName: "Sistem" });
  });

  it("dashboard mengoersi string numerik Postgres menjadi number", () => {
    const wire = {
      orders_today: 2,
      sales_today: "40000",
      outstanding: "20000",
      cash_balance: 0,
      workload: [{ status: "washing", count: "3" }],
      ready_waiting: [],
    } as unknown as WireDashboard;
    const summary = Mappers.dashboard(wire);
    expect(summary.salesToday).toBe(40000);
    expect(summary.workload[0]).toMatchObject({ status: "washing", count: 3 });
  });

  it("report mengoersi agregat string menjadi number", () => {
    const wire = {
      from: "2026-08-04",
      to: "2026-09-04",
      revenue_total: "20000",
      orders_total: 1,
      revenue_by_day: [{ date: "2026-09-04", revenue: "20000", orders: 1 }],
      orders_by_status: [{ status: "received", count: "1" }],
      top_services: [{ name: "Cuci Setrika", qty: "2.00", revenue: "20000" }],
    } as unknown as WireReport;
    const report = Mappers.report(wire);
    expect(report.revenueTotal).toBe(20000);
    expect(report.topServices[0]).toMatchObject({ qty: 2, revenue: 20000 });
  });

  it("task memetakan driver dan null-nya", () => {
    const base = {
      id: 4,
      outlet_id: 2,
      type: "pickup",
      status: "assigned",
      scheduled_at: "2026-09-05T10:00:00Z",
      address: "Jl. Contoh",
      notes: null,
      proof_url: null,
      completed_at: null,
      order: { id: 11, ticket: "KMG-20260904-001" },
    };
    const assigned = Mappers.task(
      { ...base, driver: { id: 6, name: "Ketut Arya" } },
      "tnt-1"
    );
    expect(assigned).toMatchObject({
      id: "4",
      tenantId: "tnt-1",
      driverId: "6",
      driverName: "Ketut Arya",
    });
    const unassigned = Mappers.task({ ...base, driver: null }, "tnt-1");
    expect(unassigned.driverId).toBeNull();
    expect(unassigned.driverName).toBeNull();
  });

  it("cash dan summary numerik", () => {
    const entry = Mappers.cash({
      id: 3,
      outlet_id: 2,
      type: "expense",
      category: "Deterjen",
      amount: "15000",
      balance_impact: "-15000",
      payment_method: "cash",
      order_id: null,
      note: null,
      occurred_at: "2026-09-04",
    } as unknown as Parameters<typeof Mappers.cash>[0]);
    expect(entry).toMatchObject({ id: "3", balanceImpact: -15000, paymentMethod: "cash" });

    const summary = Mappers.cashSummary({
      date: "2026-09-04",
      income: "250000",
      expense: "45000",
      balance: "205000",
      closed: true,
    } as unknown as Parameters<typeof Mappers.cashSummary>[0]);
    expect(summary).toMatchObject({ balance: 205000, closed: true });
  });

  it("notifikasi memakai default jujur bila null", () => {
    const item = Mappers.notification({
      id: "abc",
      type: "OrderNotification",
      title: null,
      body: null,
      read_at: null,
      created_at: null,
    });
    expect(item).toMatchObject({ id: "abc", title: "(tanpa judul)", body: "" });
  });

  it("subscription memetakan plan dan usage", () => {
    const sub = Mappers.subscription({
      plan: "growth",
      plan_label: "Growth",
      status: "trial",
      limits: { outlets: 3, users: 10, orders_per_month: 2000 },
      usage: { outlets: 2, users: 6, orders_this_month: 11 },
    });
    expect(sub).toMatchObject({
      plan: "growth",
      planLabel: "Growth",
      usage: { outlets: 2, users: 6, orders_this_month: 11 },
    });
  });
});

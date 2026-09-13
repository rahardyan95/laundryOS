import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderReceipt } from "@/components/orders/order-receipt";
import type { Order } from "@/lib/api/types";

const order: Order = {
  id: "ord-1",
  tenantId: "tnt-1",
  outletId: "olt-1",
  ticket: "KMG-20260904-001",
  customerId: "cst-1",
  customerName: "Dewi Lestari",
  customerPhone: "0812",
  items: [
    {
      id: "itm-1",
      orderId: "ord-1",
      serviceId: "svc-2",
      serviceName: "Cuci Setrika",
      unit: "kg",
      qty: 2.5,
      unitPrice: 11000,
      subtotal: 27500,
    },
  ],
  pickupRequested: false,
  deliveryRequested: false,
  status: "received",
  paymentStatus: "partial",
  paymentMethod: "cash",
  paidAmount: 10000,
  total: 27500,
  createdAt: new Date(2026, 8, 4, 10, 0).toISOString(),
  history: [],
};

describe("OrderReceipt", () => {
  it("menampilkan ticket, pelanggan, item, dan total", () => {
    render(<OrderReceipt order={order} outletName="LaundryOS Kemang" />);
    expect(screen.getByText("LaundryOS Kemang")).toBeInTheDocument();
    expect(screen.getByText("KMG-20260904-001")).toBeInTheDocument();
    expect(screen.getByText("Dewi Lestari")).toBeInTheDocument();
    expect(screen.getByText("Cuci Setrika")).toBeInTheDocument();
    expect(screen.getByText("Diterima")).toBeInTheDocument();
  });
});

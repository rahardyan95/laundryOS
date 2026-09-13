import { describe, expect, it } from "vitest";
import { OrderMachine } from "@/lib/order-machine";

describe("OrderMachine", () => {
  it("memiliki 6 tahap sesuai FRD", () => {
    expect(OrderMachine.FLOW).toEqual([
      "received",
      "washing",
      "drying",
      "ironing",
      "ready",
      "completed",
    ]);
  });

  it("next() maju satu tahap dan null di ujung", () => {
    expect(OrderMachine.next("received")).toBe("washing");
    expect(OrderMachine.next("ready")).toBe("completed");
    expect(OrderMachine.next("completed")).toBeNull();
    expect(OrderMachine.next("cancelled")).toBeNull();
  });

  it("canTransition hanya mengizinkan maju satu tahap", () => {
    expect(OrderMachine.canTransition("received", "washing")).toBe(true);
    expect(OrderMachine.canTransition("received", "drying")).toBe(false);
    expect(OrderMachine.canTransition("completed", "washing")).toBe(false);
    expect(OrderMachine.canTransition("washing", "washing")).toBe(false);
  });

  it("canTransition mengizinkan cancel hanya dari received", () => {
    expect(OrderMachine.canTransition("received", "cancelled")).toBe(true);
    expect(OrderMachine.canTransition("washing", "cancelled")).toBe(false);
    expect(OrderMachine.canTransition("ready", "cancelled")).toBe(false);
  });

  it("label berbahasa Indonesia", () => {
    expect(OrderMachine.label("received")).toBe("Diterima");
    expect(OrderMachine.label("ready")).toBe("Siap Diambil");
    expect(OrderMachine.label("completed")).toBe("Selesai");
    expect(OrderMachine.label("cancelled")).toBe("Dibatalkan");
  });
});

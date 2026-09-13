import { describe, expect, it } from "vitest";
import { PaymentPolicy } from "@/lib/payment-policy";

describe("PaymentPolicy", () => {
  it("menentukan status dari nominal", () => {
    expect(PaymentPolicy.status(10000, 10000)).toBe("paid");
    expect(PaymentPolicy.status(12000, 10000)).toBe("paid");
    expect(PaymentPolicy.status(5000, 10000)).toBe("partial");
    expect(PaymentPolicy.status(0, 10000)).toBe("unpaid");
  });

  it("total nol tidak dianggap lunas", () => {
    expect(PaymentPolicy.status(0, 0)).toBe("unpaid");
  });

  it("label mengikuti status", () => {
    expect(PaymentPolicy.label("paid")).toBe("Lunas");
    expect(PaymentPolicy.label("partial")).toBe("DP");
    expect(PaymentPolicy.label("unpaid")).toBe("Belum Bayar");
  });

  it("validasi draft menolak tanpa pelanggan/item/overpay", () => {
    const base = { hasCustomer: true, hasItems: true, paid: 5000, total: 10000 };
    expect(PaymentPolicy.validateDraft(base).valid).toBe(true);
    expect(PaymentPolicy.validateDraft({ ...base, hasCustomer: false }).valid).toBe(false);
    expect(PaymentPolicy.validateDraft({ ...base, hasItems: false }).valid).toBe(false);
    expect(PaymentPolicy.validateDraft({ ...base, paid: 20000 }).valid).toBe(false);
    expect(PaymentPolicy.validateDraft({ ...base, paid: -1 }).valid).toBe(false);
  });
});

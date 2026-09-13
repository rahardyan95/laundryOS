import { beforeEach, describe, expect, it } from "vitest";
import { SessionManager } from "@/lib/api/session";
import type { SessionPayload } from "@/lib/api/types";

const payload: SessionPayload = {
  user: {
    id: "usr-1",
    tenantId: "tnt-1",
    outletId: "olt-1",
    name: "Budi Santoso",
    email: "owner@laundryos.test",
    role: "owner",
  },
  tenant: { id: "tnt-1", name: "LaundryOS Demo", plan: "growth", status: "trial" },
  outlets: [],
};

describe("SessionManager", () => {
  beforeEach(() => {
    SessionManager.clear();
  });

  it("get null saat belum login", () => {
    expect(SessionManager.get()).toBeNull();
    expect(SessionManager.token()).toBeNull();
    expect(SessionManager.outletId()).toBeNull();
  });

  it("set lalu get mengembalikan payload", () => {
    SessionManager.set(payload);
    expect(SessionManager.get()?.user.email).toBe("owner@laundryos.test");
  });

  it("outletId memakai fallback bila belum dipilih", () => {
    expect(SessionManager.outletId("olt-9")).toBe("olt-9");
    SessionManager.setOutletId("olt-2");
    expect(SessionManager.outletId("olt-9")).toBe("olt-2");
  });

  it("token set lalu clear terhapus", () => {
    SessionManager.setToken("abc123");
    expect(SessionManager.token()).toBe("abc123");
    SessionManager.setToken(null);
    expect(SessionManager.token()).toBeNull();
  });

  it("clear menghapus sesi, outlet, dan token sekaligus", () => {
    SessionManager.set(payload);
    SessionManager.setOutletId("olt-2");
    SessionManager.setToken("abc123");
    SessionManager.clear();
    expect(SessionManager.get()).toBeNull();
    expect(SessionManager.outletId()).toBeNull();
    expect(SessionManager.token()).toBeNull();
  });
});

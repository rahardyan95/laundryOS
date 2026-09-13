import { describe, expect, it } from "vitest";
import { NavPolicy } from "@/lib/nav-policy";

describe("NavPolicy", () => {
  it("owner melihat semua menu termasuk pengaturan dan laporan", () => {
    const hrefs = NavPolicy.itemsFor("owner").map((i) => i.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/orders",
        "/customers",
        "/tasks",
        "/cash",
        "/catalog",
        "/reports",
        "/settings",
      ])
    );
  });

  it("kasir hanya menu operasional terbatas", () => {
    const hrefs = NavPolicy.itemsFor("cashier").map((i) => i.href);
    expect(hrefs).toEqual(
      expect.arrayContaining(["/orders", "/customers", "/catalog", "/cash"])
    );
    expect(hrefs).not.toContain("/settings");
    expect(hrefs).not.toContain("/dashboard");
    expect(hrefs).not.toContain("/reports");
  });

  it("kurir hanya menu antar-jemput", () => {
    expect(NavPolicy.itemsFor("driver").map((i) => i.href)).toEqual(["/tasks"]);
  });

  it("operator hanya menu order", () => {
    expect(NavPolicy.itemsFor("operator").map((i) => i.href)).toEqual(["/orders"]);
  });

  it("roleLabel berbahasa Indonesia", () => {
    expect(NavPolicy.roleLabel("owner")).toBe("Pemilik");
    expect(NavPolicy.roleLabel("driver")).toBe("Kurir");
  });
});

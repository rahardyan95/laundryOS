import { describe, expect, it } from "vitest";
import { Format } from "@/lib/format";

describe("Format", () => {
  it("rupiah tanpa desimal dengan prefix Rp", () => {
    expect(Format.rupiah(27500).replace(/\s/g, "")).toBe("Rp27.500");
    expect(Format.rupiah(0).replace(/\s/g, "")).toBe("Rp0");
  });

  it("isSameDay membandingkan tanggal kalender", () => {
    const now = new Date();
    expect(Format.isSameDay(now.toISOString(), now)).toBe(true);
    const yesterday = new Date(now.getTime() - 86_400_000);
    expect(Format.isSameDay(yesterday.toISOString(), now)).toBe(false);
  });

  it("date dan dateTime mengembalikan string tak kosong", () => {
    const iso = new Date(2026, 8, 4, 10, 30).toISOString();
    expect(Format.date(iso).length).toBeGreaterThan(0);
    expect(Format.dateTime(iso).length).toBeGreaterThan(0);
  });
});

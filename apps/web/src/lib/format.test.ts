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

  it("todayIso dan isoDaysAgo berformat YYYY-MM-DD", () => {
    expect(Format.todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Format.isoDaysAgo(0)).toBe(Format.todayIso());
    expect(Format.isoDaysAgo(30)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("initials mengambil maksimal dua huruf awal", () => {
    expect(Format.initials("Budi Santoso")).toBe("BS");
    expect(Format.initials("Laundry")).toBe("L");
    expect(Format.initials("dewi ayu lestari")).toBe("DA");
  });

  it("greeting mengikuti jam", () => {
    expect(Format.greeting(new Date(2026, 0, 1, 8))).toBe("Selamat pagi");
    expect(Format.greeting(new Date(2026, 0, 1, 13))).toBe("Selamat siang");
    expect(Format.greeting(new Date(2026, 0, 1, 17))).toBe("Selamat sore");
    expect(Format.greeting(new Date(2026, 0, 1, 21))).toBe("Selamat malam");
  });

  it("duration menyertakan hari saat kelipatan 24 jam", () => {
    expect(Format.duration(6)).toBe("6 jam");
    expect(Format.duration(48)).toBe("48 jam (2 hari)");
    expect(Format.duration(30)).toBe("30 jam");
  });
});

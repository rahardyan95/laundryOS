import type { DashboardSummary, SessionPayload } from "@/lib/api/types";
import { Format } from "@/lib/format";

export interface DashboardCard {
  title: string;
  value: string;
  hint: string;
}

export class DashboardPolicy {
  static cards(summary: DashboardSummary): DashboardCard[] {
    return [
      { title: "Order Hari Ini", value: String(summary.ordersToday), hint: "order dibuat hari ini" },
      { title: "Omzet Hari Ini", value: Format.rupiah(summary.salesToday), hint: "total order hari ini" },
      { title: "Piutang", value: Format.rupiah(summary.outstanding), hint: "belum lunas, semua order aktif" },
      { title: "Saldo Kas", value: Format.rupiah(summary.cashBalance), hint: "kas outlet saat ini" },
    ];
  }

  static firstName(session: SessionPayload | null): string {
    return session?.user.name.split(" ")[0] ?? "";
  }

  static outletName(session: SessionPayload | null, outletId: string): string {
    return session?.outlets.find((o) => o.id === outletId)?.name ?? "";
  }

  static maxWorkload(summary: DashboardSummary): number {
    return Math.max(1, ...summary.workload.map((row) => row.count));
  }

  static isPeak(count: number, max: number): boolean {
    return count > 0 && count === max;
  }

  static barPercent(count: number, max: number): number {
    return Math.round((count / max) * 100);
  }

  static todayLabel(nowIso: string): string {
    return Format.date(nowIso);
  }
}

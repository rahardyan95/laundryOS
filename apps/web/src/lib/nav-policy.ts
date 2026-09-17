import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/api/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  group: string;
}

export class NavPolicy {
  private static readonly pathRules: { prefix: string; allow: Role[] }[] = [
    { prefix: "/orders/new", allow: ["owner", "manager", "cashier"] },
    { prefix: "/orders", allow: ["owner", "manager", "cashier", "operator"] },
    { prefix: "/dashboard", allow: ["owner", "manager"] },
    { prefix: "/customers", allow: ["owner", "manager", "cashier"] },
    { prefix: "/catalog", allow: ["owner", "manager", "cashier"] },
    { prefix: "/tasks", allow: ["owner", "manager", "driver"] },
    { prefix: "/cash", allow: ["owner", "manager", "cashier"] },
    { prefix: "/reports", allow: ["owner", "manager"] },
    { prefix: "/settings", allow: ["owner", "manager"] },
  ];

  static allowForPath(pathname: string): Role[] {
    const rule = NavPolicy.pathRules.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
    return rule ? rule.allow : ["owner"];
  }

  private static readonly items: (NavItem & { roles: Role[] })[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Ringkasan", roles: ["owner", "manager"] },
    { title: "Order", href: "/orders", icon: ReceiptText, group: "Operasional", roles: ["owner", "manager", "cashier", "operator"] },
    { title: "Pelanggan", href: "/customers", icon: Users, group: "Operasional", roles: ["owner", "manager", "cashier"] },
    { title: "Antar-Jemput", href: "/tasks", icon: Truck, group: "Operasional", roles: ["owner", "manager", "driver"] },
    { title: "Kas", href: "/cash", icon: Wallet, group: "Keuangan", roles: ["owner", "manager", "cashier"] },
    { title: "Laporan", href: "/reports", icon: TrendingUp, group: "Keuangan", roles: ["owner", "manager"] },
    { title: "Katalog Layanan", href: "/catalog", icon: Package, group: "Kelola", roles: ["owner", "manager", "cashier"] },
    { title: "Pengaturan", href: "/settings", icon: Settings, group: "Kelola", roles: ["owner", "manager"] },
  ];

  static itemsFor(role: Role): NavItem[] {
    return NavPolicy.items
      .filter((item) => item.roles.includes(role))
      .map((item) => ({ title: item.title, href: item.href, icon: item.icon, group: item.group }));
  }

  static roleLabel(role: Role): string {
    const labels: Record<Role, string> = {
      owner: "Pemilik",
      manager: "Manajer",
      cashier: "Kasir",
      operator: "Operator",
      driver: "Kurir",
    };
    return labels[role];
  }

  static canCreateOrder(role: Role | undefined): boolean {
    return role === "owner" || role === "manager" || role === "cashier";
  }

  static canSwitchOutlet(role: Role | undefined): boolean {
    return role === "owner" || role === "manager";
  }

  static canManageCatalog(role: Role | undefined): boolean {
    return role === "owner" || role === "manager";
  }
}

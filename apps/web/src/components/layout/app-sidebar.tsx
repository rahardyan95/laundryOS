"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/layout/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { SessionPayload } from "@/lib/api/types";
import { NavPolicy } from "@/lib/nav-policy";

export function AppSidebar({ session }: { session: SessionPayload }) {
  const pathname = usePathname();
  const items = NavPolicy.itemsFor(session.user.role);
  const groups = [...new Set(items.map((item) => item.group))];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1.5">
          <LogoMark size={34} tone="on-dark" />
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-extrabold tracking-tight">LaundryOS</span>
            <span className="text-xs opacity-70">{session.tenant.name}</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {items
                .filter((item) => item.group === group)
                .map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-xl bg-white/10 px-3 py-2">
          <p className="truncate text-sm font-semibold">{session.user.name}</p>
          <p className="text-xs opacity-70">
            {NavPolicy.roleLabel(session.user.role)}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

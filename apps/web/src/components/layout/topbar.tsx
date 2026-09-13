"use client";

import { useRouter } from "next/navigation";
import { Building2, Check, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { api } from "@/lib/api/client";
import type { SessionPayload } from "@/lib/api/types";
import { NavPolicy } from "@/lib/nav-policy";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({
  session,
  outletId,
  onOutletChange,
}: {
  session: SessionPayload;
  outletId: string;
  onOutletChange: (id: string) => void;
}) {
  const router = useRouter();
  const canSwitch = session.user.role === "owner" || session.user.role === "manager";
  const activeOutlet = session.outlets.find((o) => o.id === outletId) ?? session.outlets[0];

  function handleLogout() {
    void api.logout().finally(() => {
      toast.success("Anda telah keluar.");
      router.replace("/login");
    });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger aria-label="Buka/tutup menu" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!canSwitch} className="gap-2">
            <Building2 className="size-4 text-muted-foreground" aria-hidden />
            <span className="font-medium">{activeOutlet?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Pilih outlet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {session.outlets.map((outlet) => (
            <DropdownMenuItem key={outlet.id} onClick={() => onOutletChange(outlet.id)}>
              <span className="flex-1">{outlet.name}</span>
              {outlet.id === outletId ? <Check className="size-4" aria-hidden /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium sm:inline">
          {NavPolicy.roleLabel(session.user.role)}
        </span>
        <Avatar className="size-8">
          <AvatarFallback>{initials(session.user.name)}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Keluar">
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}

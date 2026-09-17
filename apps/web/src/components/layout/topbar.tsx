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
import type { SessionPayload } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { NavPolicy } from "@/lib/nav-policy";
import { SessionActions } from "@/lib/session-actions";
import { SessionManager } from "@/lib/api/session";

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
  const canSwitch = NavPolicy.canSwitchOutlet(session.user.role);
  const activeOutlet = SessionManager.activeOutlet(session, outletId);

  function handleLogout() {
    void SessionActions.logout().finally(() => {
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
          <AvatarFallback>{Format.initials(session.user.name)}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Keluar">
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}

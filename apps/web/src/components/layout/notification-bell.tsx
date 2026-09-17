"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification } from "@/lib/api/types";
import { Format } from "@/lib/format";
import { NotificationController } from "@/lib/notification-controller";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    void NotificationController.unreadCount().then(setUnread);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, NotificationController.pollIntervalMs);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setItems(await NotificationController.list());
    }
  }

  async function handleRead(item: AppNotification) {
    if (item.readAt) return;
    const updated = await NotificationController.markRead(item);
    setItems((prev) => prev.map((n) => (n.id === item.id ? updated : n)));
    refresh();
  }

  async function handleReadAll() {
    setItems(await NotificationController.markAllRead(items));
    setUnread(0);
  }

  const badge = NotificationController.badge(unread);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <Bell className="size-4" aria-hidden />
          {badge ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleReadAll}>
              Tandai semua dibaca
            </Button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi.
          </p>
        ) : (
          items.slice(0, NotificationController.maxShown).map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleRead(item)}
              className="flex flex-col items-start gap-1"
            >
              <span className="flex w-full items-center gap-2">
                {!item.readAt ? (
                  <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                ) : null}
                <span className="text-sm font-medium">{item.title}</span>
              </span>
              <span className="text-xs text-muted-foreground">{item.body}</span>
              <span className="text-[11px] text-muted-foreground">
                {item.createdAt ? Format.dateTime(item.createdAt) : ""}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

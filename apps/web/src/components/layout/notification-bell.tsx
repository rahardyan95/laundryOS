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
import { api } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api/types";
import { Format } from "@/lib/format";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    api
      .getUnreadCount()
      .then(setUnread)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      try {
        setItems(await api.listNotifications());
      } catch {
        // abaikan: dropdown tetap bisa dibuka
      }
    }
  }

  async function handleRead(item: AppNotification) {
    if (item.readAt) return;
    try {
      await api.markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      refresh();
    } catch {
      // abaikan: hitung ulang saat refresh berikutnya
    }
  }

  async function handleReadAll() {
    try {
      await api.markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
      setUnread(0);
    } catch {
      // abaikan: hitung ulang saat refresh berikutnya
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifikasi" className="relative">
          <Bell className="size-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
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
          items.slice(0, 8).map((item) => (
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

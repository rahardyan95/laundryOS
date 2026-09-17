import { api } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api/types";
import { Clock } from "@/lib/clock";

export class NotificationController {
  static readonly pollIntervalMs = 60000;
  static readonly maxShown = 8;

  static async unreadCount(): Promise<number> {
    try {
      return await api.getUnreadCount();
    } catch {
      return 0;
    }
  }

  static async list(): Promise<AppNotification[]> {
    try {
      return await api.listNotifications();
    } catch {
      return [];
    }
  }

  static async markRead(item: AppNotification): Promise<AppNotification> {
    if (item.readAt) return item;
    try {
      await api.markNotificationRead(item.id);
    } catch {
      // abaikan: hitung ulang saat refresh berikutnya
    }
    return { ...item, readAt: Clock.nowIso() };
  }

  static async markAllRead(items: AppNotification[]): Promise<AppNotification[]> {
    try {
      await api.markAllNotificationsRead();
    } catch {
      // abaikan: hitung ulang saat refresh berikutnya
    }
    const now = Clock.nowIso();
    return items.map((n) => (n.readAt ? n : { ...n, readAt: now }));
  }

  static badge(unread: number): string | null {
    if (unread <= 0) return null;
    return unread > 9 ? "9+" : String(unread);
  }
}

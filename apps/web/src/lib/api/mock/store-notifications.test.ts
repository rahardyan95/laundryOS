import { describe, expect, it } from "vitest";
import { InMemoryStore } from "@/lib/api/mock/store";

describe("InMemoryStore notifikasi", () => {
  it("markAllNotificationsRead mengosongkan badge", () => {
    const store = new InMemoryStore();
    expect(store.unreadCount()).toBeGreaterThan(0);
    store.markAllNotificationsRead();
    expect(store.unreadCount()).toBe(0);
    expect(store.notifications().every((n) => n.readAt !== null)).toBe(true);
  });

  it("markAll idempoten dan tidak menambah item", () => {
    const store = new InMemoryStore();
    const before = store.notifications().length;
    store.markAllNotificationsRead();
    store.markAllNotificationsRead();
    expect(store.unreadCount()).toBe(0);
    expect(store.notifications()).toHaveLength(before);
  });
});

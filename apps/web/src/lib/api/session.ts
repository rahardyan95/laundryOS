import type { SessionPayload } from "@/lib/api/types";

const STORAGE_KEY = "laundryos.session";
const OUTLET_KEY = "laundryos.outlet";

export class SessionManager {
  private static storage(): Storage | null {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  }

  static get(): SessionPayload | null {
    const raw = SessionManager.storage()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionPayload;
    } catch {
      SessionManager.clear();
      return null;
    }
  }

  static set(payload: SessionPayload): void {
    SessionManager.storage()?.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  static clear(): void {
    const store = SessionManager.storage();
    if (!store) return;
    store.removeItem(STORAGE_KEY);
    store.removeItem(OUTLET_KEY);
  }

  static outletId(fallback?: string): string | null {
    const store = SessionManager.storage();
    if (!store) return fallback ?? null;
    return store.getItem(OUTLET_KEY) ?? fallback ?? null;
  }

  static setOutletId(id: string): void {
    SessionManager.storage()?.setItem(OUTLET_KEY, id);
  }
}

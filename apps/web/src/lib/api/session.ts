import type { Outlet, SessionPayload } from "@/lib/api/types";

const STORAGE_KEY = "laundryos.session";
const OUTLET_KEY = "laundryos.outlet";
const CHANGED_EVENT = "laundryos:session-changed";

export class SessionManager {
  private static storage(): Storage | null {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  }

  private static snapshotRaw: string | null | undefined;
  private static snapshot: SessionPayload | null = null;

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
    SessionManager.emitChanged();
  }

  static clear(): void {
    const store = SessionManager.storage();
    if (!store) return;
    store.removeItem(STORAGE_KEY);
    store.removeItem(OUTLET_KEY);
    SessionManager.emitChanged();
  }

  /**
   * Snapshot stabil untuk useSyncExternalStore: referensi sama selama isi
   * storage tak berubah (wajib — snapshot baru tiap render = loop render).
   * Dipakai dengan getServerSnapshot () => null agar SSR dan render pertama
   * klien identik.
   */
  static getSnapshot(): SessionPayload | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === SessionManager.snapshotRaw) return SessionManager.snapshot;
    SessionManager.snapshotRaw = raw;
    if (!raw) {
      SessionManager.snapshot = null;
      return null;
    }
    try {
      SessionManager.snapshot = JSON.parse(raw) as SessionPayload;
    } catch {
      // JSON rusak: buang langsung tanpa emit (hindari render-beruntun
      // saat dipanggil di fase render); snapshot null sudah stabil.
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(OUTLET_KEY);
      SessionManager.snapshot = null;
    }
    return SessionManager.snapshot;
  }

  static subscribe(listener: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = () => {
      SessionManager.snapshotRaw = undefined;
      listener();
    };
    window.addEventListener("storage", handler);
    window.addEventListener(CHANGED_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(CHANGED_EVENT, handler);
    };
  }

  private static emitChanged(): void {
    SessionManager.snapshotRaw = undefined;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    }
  }

  static outletId(fallback?: string): string | null {
    const store = SessionManager.storage();
    if (!store) return fallback ?? null;
    return store.getItem(OUTLET_KEY) ?? fallback ?? null;
  }

  static setOutletId(id: string): void {
    SessionManager.storage()?.setItem(OUTLET_KEY, id);
  }

  static activeOutlet(session: SessionPayload, outletId: string): Outlet | undefined {
    return session.outlets.find((o) => o.id === outletId) ?? session.outlets[0];
  }
}

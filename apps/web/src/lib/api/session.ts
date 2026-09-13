import type { SessionPayload } from "@/lib/api/types";

const STORAGE_KEY = "laundryos.session";
const OUTLET_KEY = "laundryos.outlet";
const TOKEN_KEY = "laundryos.token";

export class SessionManager {
  static get(): SessionPayload | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionPayload;
    } catch {
      SessionManager.clear();
      return null;
    }
  }

  static set(payload: SessionPayload): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  static clear(): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(OUTLET_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }

  static token(): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token === null) {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  static outletId(fallback?: string): string | null {
    if (typeof window === "undefined") return fallback ?? null;
    return window.sessionStorage.getItem(OUTLET_KEY) ?? fallback ?? null;
  }

  static setOutletId(id: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(OUTLET_KEY, id);
  }
}

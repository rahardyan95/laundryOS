import { api } from "@/lib/api/client";
import { SessionManager } from "@/lib/api/session";

export class SessionActions {
  static async logout(): Promise<void> {
    try {
      await api.logout();
    } finally {
      SessionManager.clear();
    }
  }
}

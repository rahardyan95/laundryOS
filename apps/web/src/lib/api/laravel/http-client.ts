import { ApiError } from "@/lib/api/api-error";

export const UNAUTHORIZED_EVENT = "laundryos:unauthorized";

interface Paginated<T> {
  data: T[];
  meta?: { current_page: number; last_page: number };
  current_page?: number;
  last_page?: number;
}

export class HttpClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly getToken: () => string | null
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    return this.request<T>("GET", path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async postForm<T>(path: string, form: FormData): Promise<T> {
    const token = this.getToken();
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });
    } catch {
      throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi.");
    }

    if (!response.ok) {
      HttpClient.notifyUnauthorized(response.status);
      throw new ApiError(response.status, await HttpClient.errorMessage(response));
    }

    return (await response.json()) as T;
  }

  async download(path: string, params?: Record<string, string | number>): Promise<Blob> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        query.set(key, String(value));
      }
      const suffix = query.toString();
      if (suffix) url += `?${suffix}`;
    }

    const token = this.getToken();
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "text/csv",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi.");
    }

    if (!response.ok) {
      HttpClient.notifyUnauthorized(response.status);
      throw new ApiError(response.status, await HttpClient.errorMessage(response));
    }

    return response.blob();
  }

  async fetchAll<T>(path: string, params?: Record<string, string | number>): Promise<T[]> {
    const all: T[] = [];
    let page = 1;

    for (;;) {
      const res = await this.get<Paginated<T>>(path, { ...params, page });
      all.push(...res.data);
      const current = res.meta?.current_page ?? res.current_page ?? 1;
      const last = res.meta?.last_page ?? res.last_page ?? 1;
      if (current >= last) break;
      page += 1;
    }

    return all;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        query.set(key, String(value));
      }
      const suffix = query.toString();
      if (suffix) url += `?${suffix}`;
    }

    const token = this.getToken();
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "Tidak dapat terhubung ke server. Periksa koneksi.");
    }

    if (!response.ok) {
      HttpClient.notifyUnauthorized(response.status);
      throw new ApiError(response.status, await HttpClient.errorMessage(response));
    }

    if (response.status === 204) return undefined as T;

    return (await response.json()) as T;
  }

  private static notifyUnauthorized(status: number): void {
    if (status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
  }

  private static async errorMessage(response: Response): Promise<string> {
    try {
      const data = (await response.json()) as { message?: unknown };
      if (typeof data.message === "string" && data.message.length > 0) return data.message;
    } catch {
      // abaikan: pakai pesan default di bawah
    }

    return `Permintaan gagal (${response.status}).`;
  }
}

import { ApiError } from "@/lib/api/api-error";

export class HttpClient {
  static readonly UNAUTHORIZED_EVENT = "laundryos:unauthorized";

  private readonly baseUrl: string;
  private readonly origin: string;

  constructor(
    baseUrl: string,
    private readonly getToken?: () => string | null
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    try {
      this.origin = new URL(this.baseUrl).origin;
    } catch {
      this.origin = this.baseUrl;
    }
  }

  async csrf(): Promise<void> {
    try {
      await fetch(`${this.origin}/sanctum/csrf-cookie`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } catch {
      // Diabaikan: bila server tak terjangkau, request berikutnya akan gagal jelas.
    }
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
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        credentials: "include",
        headers: this.headers(),
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

    let response: Response;

    try {
      response = await fetch(url, {
        credentials: "include",
        headers: this.headers({ Accept: "text/csv" }),
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
      const res = await this.get<_PrivatePaginated<T>>(path, { ...params, page });
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

    let response: Response;

    try {
      response = await fetch(url, {
        method,
        credentials: "include",
        headers: this.headers({ "Content-Type": "application/json" }),
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

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = { Accept: "application/json", ...extra };

    const token = this.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const xsrf = HttpClient.xsrfToken();
    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

    return headers;
  }

  private static xsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private static notifyUnauthorized(status: number): void {
    if (status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(HttpClient.UNAUTHORIZED_EVENT));
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

interface _PrivatePaginated<T> {
  data: T[];
  meta?: { current_page: number; last_page: number };
  current_page?: number;
  last_page?: number;
}

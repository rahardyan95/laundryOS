import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { HttpClient } from "@/lib/api/laravel/http-client";

function jsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

describe("HttpClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET mengirim token bearer bila ada", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new HttpClient("http://x.test/api/v1", () => "tok-123");

    await client.get("/orders");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(fetchMock).toHaveBeenCalledOnce();
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-123");
  });

  it("GET tanpa token tidak mengirim Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new HttpClient("http://x.test/api/v1", () => null);

    await client.get("/orders");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("POST mengirim body JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 1 } }, 201));
    vi.stubGlobal("fetch", fetchMock);
    const client = new HttpClient("http://x.test/api/v1", () => null);

    await client.post("/customers", { name: "Dewi" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://x.test/api/v1/customers");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Dewi" }));
  });

  it("respons error memakai message dari body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Kas tanggal tersebut sudah ditutup." }, 422))
    );
    const client = new HttpClient("http://x.test/api/v1", () => null);

    const error = await client.get("/cash-entries").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).message).toBe("Kas tanggal tersebut sudah ditutup.");
  });

  it("respons error tanpa body memakai pesan default", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => null })
    );
    const client = new HttpClient("http://x.test/api/v1", () => null);

    const error = await client.get("/orders").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe("Permintaan gagal (500).");
  });

  it("fetch gagal total menjadi ApiError status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );
    const client = new HttpClient("http://x.test/api/v1", () => null);

    const error = await client.get("/orders").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });

  it("fetchAll mengikuti pagination envelope meta", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ id: 1 }], meta: { current_page: 1, last_page: 2 } })
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ id: 2 }], meta: { current_page: 2, last_page: 2 } })
      );
    vi.stubGlobal("fetch", fetchMock);
    const client = new HttpClient("http://x.test/api/v1", () => null);

    const all = await client.fetchAll<{ id: number }>("/orders");

    expect(all).toEqual([{ id: 1 }, { id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fetchAll mendukung paginator flat tanpa meta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ data: [{ id: 9 }], current_page: 1, last_page: 1 })
      )
    );
    const client = new HttpClient("http://x.test/api/v1", () => null);

    const all = await client.fetchAll<{ id: number }>("/notifications");

    expect(all).toEqual([{ id: 9 }]);
  });
});

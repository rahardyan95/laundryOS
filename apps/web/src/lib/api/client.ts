import type { ApiClient } from "@/lib/api/api-client";
import { LaravelApiClient } from "@/lib/api/laravel/laravel-api-client";
import { MockApiClient } from "@/lib/api/mock/mock-api-client";

export function createApiClient(): ApiClient {
  if (process.env.NEXT_PUBLIC_API_MODE === "laravel") {
    return new LaravelApiClient();
  }
  return new MockApiClient();
}

export const api: ApiClient = createApiClient();

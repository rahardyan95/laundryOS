import type { ApiClient } from "@/lib/api/api-client";
import { ApiClientFactory } from "@/lib/api/api-client-factory";

export class AppDependencies {
  private static _api: ApiClient | null = null;

  static api(): ApiClient {
    if (!AppDependencies._api) {
      AppDependencies._api = ApiClientFactory.create();
    }
    return AppDependencies._api;
  }

  static resetForTesting(): void {
    AppDependencies._api = null;
  }
}

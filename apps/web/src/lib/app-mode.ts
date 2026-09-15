export type ApiMode = "mock" | "laravel";

export class AppMode {
  static mode(raw?: string): ApiMode {
    return raw === "laravel" ? "laravel" : "mock";
  }

  static isLaravel(raw?: string): boolean {
    return AppMode.mode(raw) === "laravel";
  }

  static passwordPlaceholder(raw?: string): string {
    return AppMode.isLaravel(raw) ? "Kata sandi akun demo" : "Isi bebas (mode demo)";
  }

  static demoHint(raw?: string): string | null {
    if (!AppMode.isLaravel(raw)) return null;
    return "Mode API nyata — gunakan kata sandi demo: password untuk semua akun.";
  }
}

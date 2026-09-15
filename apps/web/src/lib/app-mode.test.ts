import { describe, expect, it } from "vitest";
import { AppMode } from "@/lib/app-mode";

describe("AppMode", () => {
  it("mode default adalah mock", () => {
    expect(AppMode.mode(undefined)).toBe("mock");
    expect(AppMode.isLaravel(undefined)).toBe(false);
  });

  it("mengenali mode laravel", () => {
    expect(AppMode.mode("laravel")).toBe("laravel");
    expect(AppMode.isLaravel("laravel")).toBe(true);
  });

  it("placeholder kata sandi jujur per mode", () => {
    expect(AppMode.passwordPlaceholder("mock")).toBe("Isi bebas (mode demo)");
    expect(AppMode.passwordPlaceholder("laravel")).toBe("Kata sandi akun demo");
    expect(AppMode.passwordPlaceholder(undefined)).toBe("Isi bebas (mode demo)");
  });

  it("hint demo hanya tampil di mode laravel", () => {
    expect(AppMode.demoHint("mock")).toBeNull();
    expect(AppMode.demoHint(undefined)).toBeNull();
    expect(AppMode.demoHint("laravel")).toContain("password");
  });
});

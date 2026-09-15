import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";

function mockMatchMedia(width: number): Set<() => void> {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: width < 768,
    media: "(max-width: 767px)",
    addEventListener: (_type: string, callback: () => void) => {
      listeners.add(callback);
    },
    removeEventListener: (_type: string, callback: () => void) => {
      listeners.delete(callback);
    },
    dispatchEvent: () => {
      listeners.forEach((callback) => callback());
      return true;
    },
  }));
  return listeners;
}

describe("useIsMobile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("false di desktop tanpa loop render", () => {
    mockMatchMedia(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("true di viewport seluler setelah mount", () => {
    mockMatchMedia(390);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("bereaksi terhadap perubahan viewport dan bersih-bersih listener", () => {
    const listeners = mockMatchMedia(1024);
    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: 390,
      });
      listeners.forEach((callback) => callback());
    });
    expect(result.current).toBe(true);

    unmount();
    expect(listeners.size).toBe(0);
  });
});

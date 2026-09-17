export class MobileViewport {
  static readonly breakpoint = 768;

  static query(): string {
    return `(max-width: ${MobileViewport.breakpoint - 1}px)`;
  }

  static subscribe(callback: () => void): () => void {
    const mql = window.matchMedia(MobileViewport.query());
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }

  static snapshot(): boolean {
    return window.innerWidth < MobileViewport.breakpoint;
  }

  static serverSnapshot(): boolean {
    return false;
  }
}

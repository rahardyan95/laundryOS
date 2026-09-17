export class Clock {
  static nowIso(): string {
    return new Date().toISOString();
  }

  static hoursFromNowIso(hours: number): string {
    return new Date(Date.now() + hours * 3_600_000).toISOString();
  }

  static hoursAgoIso(hoursAgo: number): string {
    return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
  }

  static todayStamp(): string {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  }

  static hoursBetweenIso(fromIso: string, toIso?: string): number {
    const to = toIso ? new Date(toIso).getTime() : Date.now();
    return Math.round((to - new Date(fromIso).getTime()) / 3_600_000);
  }

  static daysAgoDate(daysAgo: number): string {
    return new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);
  }
}

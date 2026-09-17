export class Sorter {
  static byCreatedDesc<T extends { createdAt: string }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static byScheduledAsc<T extends { scheduledAt: string }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  static byDateAsc<T extends { date: string }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.date.localeCompare(b.date));
  }

  static byNameAsc<T extends { name: string }>(rows: T[]): T[] {
    return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }
}

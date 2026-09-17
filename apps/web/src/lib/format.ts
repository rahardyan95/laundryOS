import { Clock } from "@/lib/clock";

export class Format {
  static rupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  static dateTime(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  static date(iso: string): string {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  }

  static isSameDay(iso: string, ref: Date = new Date()): boolean {
    const d = new Date(iso);
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate()
    );
  }

  static todayIso(): string {
    return Clock.nowIso().slice(0, 10);
  }

  static isoDaysAgo(days: number): string {
    return Clock.daysAgoDate(days);
  }

  static initials(name: string): string {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  static greeting(date: Date = new Date()): string {
    const hour = date.getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 19) return "Selamat sore";
    return "Selamat malam";
  }

  static duration(hours: number): string {
    if (hours >= 24 && hours % 24 === 0) return `${hours} jam (${hours / 24} hari)`;
    return `${hours} jam`;
  }
}

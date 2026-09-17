export class SchedulePolicy {
  static isFutureIso(iso: string | undefined): boolean {
    if (!iso) return false;
    const at = new Date(iso).getTime();
    return !Number.isNaN(at) && at > Date.now();
  }
}

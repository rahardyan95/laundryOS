import type { DeliveryTaskStatus } from "@/lib/api/types";

export class TaskMachine {
  static readonly labels: Record<DeliveryTaskStatus, string> = {
    pending: "Menunggu",
    assigned: "Ditugaskan",
    in_progress: "Dikerjakan",
    done: "Selesai",
    cancelled: "Dibatalkan",
  };

  static label(status: DeliveryTaskStatus): string {
    return TaskMachine.labels[status];
  }

  static next(status: DeliveryTaskStatus): DeliveryTaskStatus | null {
    if (status === "pending") return "assigned";
    if (status === "assigned") return "in_progress";
    if (status === "in_progress") return "done";
    return null;
  }

  static nextLabel(status: DeliveryTaskStatus): string | null {
    if (status === "pending") return "Tugaskan";
    if (status === "assigned") return "Mulai Kerjakan";
    if (status === "in_progress") return "Selesaikan";
    return null;
  }
}

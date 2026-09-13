import { Badge } from "@/components/ui/badge";
import type { DeliveryTaskStatus } from "@/lib/api/types";

const styles: Record<DeliveryTaskStatus, string> = {
  pending: "border-stone-300 bg-stone-100 text-stone-700",
  assigned: "border-sky-200 bg-sky-100 text-sky-800",
  in_progress: "border-amber-200 bg-amber-100 text-amber-800",
  done: "border-emerald-200 bg-emerald-100 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const labels: Record<DeliveryTaskStatus, string> = {
  pending: "Menunggu",
  assigned: "Ditugaskan",
  in_progress: "Dikerjakan",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

export function TaskStatusBadge({ status }: { status: DeliveryTaskStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

export function nextTaskLabel(status: DeliveryTaskStatus): string | null {
  if (status === "pending") return "Tugaskan";
  if (status === "assigned") return "Mulai Kerjakan";
  if (status === "in_progress") return "Selesaikan";
  return null;
}

export function nextTaskStatus(status: DeliveryTaskStatus): DeliveryTaskStatus | null {
  if (status === "pending") return "assigned";
  if (status === "assigned") return "in_progress";
  if (status === "in_progress") return "done";
  return null;
}

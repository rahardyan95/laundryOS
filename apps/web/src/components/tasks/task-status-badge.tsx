import { Badge } from "@/components/ui/badge";
import type { DeliveryTaskStatus } from "@/lib/api/types";
import { TaskMachine } from "@/lib/task-machine";

const styles: Record<DeliveryTaskStatus, string> = {
  pending: "border-stone-300 bg-stone-100 text-stone-700",
  assigned: "border-sky-200 bg-sky-100 text-sky-800",
  in_progress: "border-amber-200 bg-amber-100 text-amber-800",
  done: "border-emerald-200 bg-emerald-100 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export function TaskStatusBadge({ status }: { status: DeliveryTaskStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {TaskMachine.label(status)}
    </Badge>
  );
}

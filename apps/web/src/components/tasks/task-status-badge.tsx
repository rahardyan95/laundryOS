import { Badge } from "@/components/ui/badge";
import type { DeliveryTaskStatus } from "@/lib/api/types";
import { StatusTones } from "@/lib/status-tones";
import { TaskMachine } from "@/lib/task-machine";

export function TaskStatusBadge({ status }: { status: DeliveryTaskStatus }) {
  return (
    <Badge variant="outline" className={StatusTones.taskTone(status)}>
      {TaskMachine.label(status)}
    </Badge>
  );
}

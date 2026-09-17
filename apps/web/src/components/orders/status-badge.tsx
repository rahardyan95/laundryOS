import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { OrderMachine } from "@/lib/order-machine";
import { StatusTones } from "@/lib/status-tones";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={StatusTones.orderTone(status)}>
      {OrderMachine.label(status)}
    </Badge>
  );
}

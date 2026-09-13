import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { OrderMachine } from "@/lib/order-machine";

const styles: Record<OrderStatus, string> = {
  received: "border-stone-300 bg-stone-100 text-stone-700",
  washing: "border-sky-200 bg-sky-100 text-sky-800",
  drying: "border-amber-200 bg-amber-100 text-amber-800",
  ironing: "border-violet-200 bg-violet-100 text-violet-800",
  ready: "border-transparent bg-primary text-primary-foreground",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {OrderMachine.label(status)}
    </Badge>
  );
}

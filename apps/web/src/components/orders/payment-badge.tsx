import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/api/types";

const styles: Record<PaymentStatus, string> = {
  paid: "border-emerald-200 bg-emerald-100 text-emerald-800",
  partial: "border-amber-200 bg-amber-100 text-amber-800",
  unpaid: "border-red-200 bg-red-50 text-red-700",
};

const labels: Record<PaymentStatus, string> = {
  paid: "Lunas",
  partial: "DP",
  unpaid: "Belum Bayar",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

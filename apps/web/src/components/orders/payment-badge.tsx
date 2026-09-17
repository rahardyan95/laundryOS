import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/api/types";
import { PaymentPolicy } from "@/lib/payment-policy";
import { StatusTones } from "@/lib/status-tones";

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={StatusTones.paymentTone(status)}>
      {PaymentPolicy.label(status)}
    </Badge>
  );
}

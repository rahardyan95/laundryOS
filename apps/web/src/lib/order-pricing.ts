import type { PaymentStatus, Service } from "@/lib/api/types";
import { PaymentPolicy } from "@/lib/payment-policy";

export interface PricedItemDraft {
  key: number;
  serviceId: string;
  service?: Service;
  qty: number;
  subtotal: number;
}

export class OrderPricing {
  static priceItem(
    draft: { key: number; serviceId: string; qty: string },
    services: Service[]
  ): PricedItemDraft {
    const service = services.find((s) => s.id === draft.serviceId);
    const qty = Number(draft.qty);
    const validQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    return {
      key: draft.key,
      serviceId: draft.serviceId,
      service,
      qty: validQty,
      subtotal: service ? Math.round(validQty * service.pricePerUnit) : 0,
    };
  }

  static priceAll(
    drafts: { key: number; serviceId: string; qty: string }[],
    services: Service[]
  ): PricedItemDraft[] {
    return drafts.map((draft) => OrderPricing.priceItem(draft, services));
  }

  static total(priced: Pick<PricedItemDraft, "subtotal">[]): number {
    return priced.reduce((sum, item) => sum + item.subtotal, 0);
  }

  static lineTotal(qty: number, pricePerUnit: number): number {
    return Math.round(qty * pricePerUnit);
  }

  static status(paidRaw: string, total: number): { paid: number; status: PaymentStatus; label: string } {
    const paid = Number(paidRaw) || 0;
    const status = PaymentPolicy.status(paid, total);
    return { paid, status, label: PaymentPolicy.label(status) };
  }
}

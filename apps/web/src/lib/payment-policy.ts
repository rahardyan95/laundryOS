import type { PaymentStatus } from "@/lib/api/types";

export interface OrderDraftCheck {
  hasCustomer: boolean;
  hasItems: boolean;
  paid: number;
  total: number;
}

export class PaymentPolicy {
  static readonly labels: Record<PaymentStatus, string> = {
    paid: "Lunas",
    partial: "DP",
    unpaid: "Belum Bayar",
  };

  static status(paid: number, total: number): PaymentStatus {
    if (total > 0 && paid >= total) return "paid";
    return paid > 0 ? "partial" : "unpaid";
  }

  static label(status: PaymentStatus): string {
    return PaymentPolicy.labels[status];
  }

  static validateDraft(input: OrderDraftCheck): { valid: boolean; message: string } {
    if (!input.hasCustomer) {
      return { valid: false, message: "Pilih pelanggan atau buat pelanggan baru." };
    }
    if (!input.hasItems) {
      return { valid: false, message: "Tambahkan minimal satu layanan dengan jumlah yang benar." };
    }
    if (input.paid < 0 || input.paid > input.total) {
      return { valid: false, message: "Nominal dibayar harus antara Rp0 dan total order." };
    }
    return { valid: true, message: "" };
  }
}

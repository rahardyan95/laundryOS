import "../models/service.dart";

/// Draf order baru: parsing jumlah, hitung total, dan validasi — dipisah dari
/// widget supaya bisa diuji tanpa Flutter (R1.2/R1.3).
class OrderDraft {
  const OrderDraft._();

  static double parseQty(String raw) {
    return double.tryParse(raw.replaceAll(",", ".")) ?? 0;
  }

  static Service? findService(List<Service> services, String? serviceId) {
    if (serviceId == null) return null;
    for (final service in services) {
      if (service.id == serviceId) return service;
    }
    return null;
  }

  static int total(Service? service, double qty) {
    if (service == null) return 0;
    return (qty * service.pricePerUnit).round();
  }

  static String? validate({
    required bool hasSession,
    required String? customerId,
    required String? serviceId,
    required double qty,
    required int paid,
    required int total,
  }) {
    if (!hasSession) return "Sesi berakhir. Masuk kembali.";
    if (customerId == null) return "Pilih pelanggan.";
    if (serviceId == null || qty <= 0) {
      return "Pilih layanan dan jumlah yang benar.";
    }
    if (paid < 0 || paid > total) {
      return "Nominal dibayar harus antara Rp0 dan total.";
    }
    return null;
  }
}

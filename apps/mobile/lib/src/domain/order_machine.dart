import "../models/order_status.dart";
import "status_kind.dart";

/// Mesin status order — cerminan `OrderMachine` di web & `OrderStatus` di API.
class OrderMachine {
  const OrderMachine._();

  static const List<OrderStatus> flow = [
    OrderStatus.received,
    OrderStatus.washing,
    OrderStatus.drying,
    OrderStatus.ironing,
    OrderStatus.ready,
    OrderStatus.completed,
  ];

  static OrderStatus? next(OrderStatus current) {
    final index = flow.indexOf(current);
    if (index == -1 || index == flow.length - 1) return null;
    return flow[index + 1];
  }

  static bool canTransition(OrderStatus from, OrderStatus to) {
    if (to == OrderStatus.cancelled) return from == OrderStatus.received;
    return next(from) == to;
  }

  static String label(OrderStatus status) => switch (status) {
        OrderStatus.received => "Diterima",
        OrderStatus.washing => "Dicuci",
        OrderStatus.drying => "Dikeringkan",
        OrderStatus.ironing => "Disetrika",
        OrderStatus.ready => "Siap Diambil",
        OrderStatus.completed => "Selesai",
        OrderStatus.cancelled => "Dibatalkan",
      };

  static String paymentLabel(String paymentStatus) => switch (paymentStatus) {
        "paid" => "Lunas",
        "partial" => "DP",
        _ => "Belum Bayar",
      };

  /// Arti visual status order untuk lencana (warnanya diputuskan tema).
  static StatusKind kind(OrderStatus status) => switch (status) {
        OrderStatus.received => StatusKind.neutral,
        OrderStatus.washing => StatusKind.info,
        OrderStatus.drying => StatusKind.warning,
        OrderStatus.ironing => StatusKind.attention,
        OrderStatus.ready => StatusKind.brand,
        OrderStatus.completed => StatusKind.positive,
        OrderStatus.cancelled => StatusKind.negative,
      };

  /// "Belum bayar" sengaja dibedakan dari "dibatalkan": keduanya merah, tetapi
  /// yang satu lencana garis (belum ada uang), yang satu lencana penuh.
  static StatusKind paymentKind(String paymentStatus) =>
      switch (paymentStatus) {
        "paid" => StatusKind.positive,
        "partial" => StatusKind.warning,
        _ => StatusKind.negative,
      };
}

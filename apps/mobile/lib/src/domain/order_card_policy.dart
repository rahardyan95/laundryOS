import "../domain/order_machine.dart";
import "../models/order.dart";
import "../models/order_status.dart";
import "../models/role.dart";

/// Keputusan aksi kartu order: komposisi otorisasi peran + mesin status,
/// supaya widget hanya merender (R1.2).
class OrderCardPolicy {
  const OrderCardPolicy._();

  static OrderStatus? nextOf(Order order) => OrderMachine.next(order.status);

  static bool canAdvance(Role role, Order order) {
    return role.canAdvanceOrder && nextOf(order) != null;
  }

  static bool canCancel(Role role, Order order) {
    return role.canCancelOrder && order.status == OrderStatus.received;
  }

  static bool isPaid(Order order) => order.paymentStatus == "paid";
}

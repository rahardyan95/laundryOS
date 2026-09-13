import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/lib/order_machine.dart";
import "package:laundryos_mobile/src/models/order.dart";
import "package:laundryos_mobile/src/models/role.dart";

void main() {
  test("next mengikuti alur satu tahap", () {
    expect(OrderMachine.next(OrderStatus.received), OrderStatus.washing);
    expect(OrderMachine.next(OrderStatus.ready), OrderStatus.completed);
    expect(OrderMachine.next(OrderStatus.completed), isNull);
    expect(OrderMachine.next(OrderStatus.cancelled), isNull);
  });

  test("canTransition hanya maju atau batalkan dari diterima", () {
    expect(OrderMachine.canTransition(OrderStatus.received, OrderStatus.washing), isTrue);
    expect(OrderMachine.canTransition(OrderStatus.received, OrderStatus.cancelled), isTrue);
    expect(OrderMachine.canTransition(OrderStatus.washing, OrderStatus.cancelled), isFalse);
    expect(OrderMachine.canTransition(OrderStatus.washing, OrderStatus.ready), isFalse);
  });

  test("label status dan pembayaran bahasa Indonesia", () {
    expect(OrderMachine.label(OrderStatus.ready), "Siap Diambil");
    expect(OrderMachine.paymentLabel("paid"), "Lunas");
    expect(OrderMachine.paymentLabel("partial"), "DP");
    expect(OrderMachine.paymentLabel("unpaid"), "Belum Bayar");
  });

  test("kebijakan peran konsisten dengan backend", () {
    expect(Role.driver.canViewOrders, isFalse);
    expect(Role.cashier.canCreateOrder, isTrue);
    expect(Role.cashier.canAdvanceOrder, isFalse);
    expect(Role.operator.canAdvanceOrder, isTrue);
    expect(Role.owner.canViewDashboard, isTrue);
    expect(Role.driver.isDriver, isTrue);
  });
}

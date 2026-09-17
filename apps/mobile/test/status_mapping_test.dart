import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/domain/order_machine.dart";
import "package:laundryos_mobile/src/domain/status_kind.dart";
import "package:laundryos_mobile/src/domain/task_machine.dart";
import "package:laundryos_mobile/src/models/delivery_task_status.dart";
import "package:laundryos_mobile/src/models/order_status.dart";

void main() {
  group("OrderMachine.kind", () {
    test("setiap status order punya makna visual yang berbeda", () {
      expect(OrderMachine.kind(OrderStatus.received), StatusKind.neutral);
      expect(OrderMachine.kind(OrderStatus.washing), StatusKind.info);
      expect(OrderMachine.kind(OrderStatus.drying), StatusKind.warning);
      expect(OrderMachine.kind(OrderStatus.ironing), StatusKind.attention);
      expect(OrderMachine.kind(OrderStatus.ready), StatusKind.brand);
      expect(OrderMachine.kind(OrderStatus.completed), StatusKind.positive);
      expect(OrderMachine.kind(OrderStatus.cancelled), StatusKind.negative);
    });

    test("siap diambil adalah satu-satunya status bermerek", () {
      final branded = OrderStatus.values
          .where((status) => OrderMachine.kind(status) == StatusKind.brand)
          .toList();

      expect(branded, [OrderStatus.ready]);
    });

    test("status pembayaran memetakan ke tiga tone", () {
      expect(OrderMachine.paymentKind("paid"), StatusKind.positive);
      expect(OrderMachine.paymentKind("partial"), StatusKind.warning);
      expect(OrderMachine.paymentKind("unpaid"), StatusKind.negative);
    });
  });

  group("TaskMachine.kind", () {
    test("tugas selesai positif, dibatalkan negatif, sisanya berjenjang", () {
      expect(TaskMachine.kind(DeliveryTaskStatus.pending), StatusKind.neutral);
      expect(TaskMachine.kind(DeliveryTaskStatus.assigned), StatusKind.info);
      expect(
          TaskMachine.kind(DeliveryTaskStatus.inProgress), StatusKind.warning);
      expect(TaskMachine.kind(DeliveryTaskStatus.done), StatusKind.positive);
      expect(
          TaskMachine.kind(DeliveryTaskStatus.cancelled), StatusKind.negative);
    });
  });
}

import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/domain/task_machine.dart";
import "package:laundryos_mobile/src/models/delivery_task_status.dart";
import "package:laundryos_mobile/src/models/delivery_task.dart";
import "package:laundryos_mobile/src/models/delivery_task_type.dart";

void main() {
  test("transisi task mengikuti alur", () {
    expect(TaskMachine.next(DeliveryTaskStatus.pending),
        DeliveryTaskStatus.assigned);
    expect(TaskMachine.next(DeliveryTaskStatus.assigned),
        DeliveryTaskStatus.inProgress);
    expect(TaskMachine.next(DeliveryTaskStatus.inProgress),
        DeliveryTaskStatus.done);
    expect(TaskMachine.next(DeliveryTaskStatus.done), isNull);
    expect(TaskMachine.next(DeliveryTaskStatus.cancelled), isNull);
  });

  test("label task dan tipe", () {
    expect(TaskMachine.label(DeliveryTaskStatus.inProgress), "Dikerjakan");
    expect(TaskMachine.nextLabel(DeliveryTaskStatus.assigned), "Mulai");
    expect(TaskMachine.typeLabel(DeliveryTaskType.delivery), "Delivery");
  });

  test("DeliveryTask.fromJson membaca relasi order/driver", () {
    final task = DeliveryTask.fromJson({
      "id": 3,
      "type": "pickup",
      "status": "in_progress",
      "scheduled_at": "2026-09-13T10:00:00+07:00",
      "address": "Jl. Mawar",
      "order": {"id": 1, "ticket": "SBY-1"},
      "driver": {"id": 2, "name": "Kurir A"},
    });

    expect(task.status, DeliveryTaskStatus.inProgress);
    expect(task.orderTicket, "SBY-1");
    expect(task.driverName, "Kurir A");
  });
}

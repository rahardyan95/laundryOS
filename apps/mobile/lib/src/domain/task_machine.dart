import "../models/delivery_task.dart";

class TaskMachine {
  const TaskMachine._();

  static DeliveryTaskStatus? next(DeliveryTaskStatus status) => switch (status) {
        DeliveryTaskStatus.pending => DeliveryTaskStatus.assigned,
        DeliveryTaskStatus.assigned => DeliveryTaskStatus.inProgress,
        DeliveryTaskStatus.inProgress => DeliveryTaskStatus.done,
        _ => null,
      };

  static String nextLabel(DeliveryTaskStatus status) => switch (status) {
        DeliveryTaskStatus.pending => "Tugaskan",
        DeliveryTaskStatus.assigned => "Mulai",
        DeliveryTaskStatus.inProgress => "Selesaikan",
        _ => "",
      };

  static String label(DeliveryTaskStatus status) => switch (status) {
        DeliveryTaskStatus.pending => "Menunggu",
        DeliveryTaskStatus.assigned => "Ditugaskan",
        DeliveryTaskStatus.inProgress => "Dikerjakan",
        DeliveryTaskStatus.done => "Selesai",
        DeliveryTaskStatus.cancelled => "Dibatalkan",
      };

  static String typeLabel(DeliveryTaskType type) =>
      type == DeliveryTaskType.pickup ? "Pickup" : "Delivery";
}

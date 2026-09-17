import "delivery_task_status.dart";
import "delivery_task_type.dart";

class DeliveryTask {
  const DeliveryTask({
    required this.id,
    required this.type,
    required this.status,
    required this.scheduledAt,
    required this.address,
    required this.orderTicket,
    required this.driverName,
    required this.proofUrl,
  });

  final String id;
  final DeliveryTaskType type;
  final DeliveryTaskStatus status;
  final String? scheduledAt;
  final String address;
  final String orderTicket;
  final String? driverName;
  final String? proofUrl;

  factory DeliveryTask.fromJson(Map<String, dynamic> json) {
    final order = json["order"];
    final driver = json["driver"];
    return DeliveryTask(
      id: json["id"].toString(),
      type: DeliveryTaskType.fromWire(json["type"] as String? ?? "pickup"),
      status:
          DeliveryTaskStatus.fromWire(json["status"] as String? ?? "pending"),
      scheduledAt: json["scheduled_at"] as String?,
      address: json["address"] as String? ?? "-",
      orderTicket: order is Map<String, dynamic>
          ? order["ticket"] as String? ?? "-"
          : "-",
      driverName:
          driver is Map<String, dynamic> ? driver["name"] as String? : null,
      proofUrl: json["proof_url"] as String?,
    );
  }
}

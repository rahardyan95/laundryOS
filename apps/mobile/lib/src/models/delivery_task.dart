enum DeliveryTaskStatus {
  pending("pending"),
  assigned("assigned"),
  inProgress("in_progress"),
  done("done"),
  cancelled("cancelled");

  const DeliveryTaskStatus(this.wire);

  final String wire;

  static DeliveryTaskStatus fromWire(String value) {
    return DeliveryTaskStatus.values.firstWhere(
      (status) => status.wire == value,
      orElse: () => DeliveryTaskStatus.pending,
    );
  }
}

enum DeliveryTaskType {
  pickup("pickup"),
  delivery("delivery");

  const DeliveryTaskType(this.wire);

  final String wire;

  static DeliveryTaskType fromWire(String value) {
    return DeliveryTaskType.values.firstWhere(
      (type) => type.wire == value,
      orElse: () => DeliveryTaskType.pickup,
    );
  }
}

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

class DeliveryTaskPage {
  const DeliveryTaskPage({
    required this.tasks,
    required this.currentPage,
    required this.lastPage,
  });

  final List<DeliveryTask> tasks;
  final int currentPage;
  final int lastPage;

  bool get hasMore => currentPage < lastPage;

  factory DeliveryTaskPage.fromEnvelope(Map<String, dynamic> body) {
    final data = (body["data"] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DeliveryTask.fromJson)
        .toList();
    final meta = body["meta"];
    final current =
        meta is Map ? (meta["current_page"] as num?)?.toInt() ?? 1 : 1;
    final last = meta is Map ? (meta["last_page"] as num?)?.toInt() ?? 1 : 1;
    return DeliveryTaskPage(tasks: data, currentPage: current, lastPage: last);
  }
}

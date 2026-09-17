import "delivery_task.dart";

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

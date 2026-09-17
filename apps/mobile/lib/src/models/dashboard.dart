import "ready_waiting_item.dart";
import "workload_item.dart";

class DashboardSummary {
  const DashboardSummary({
    required this.ordersToday,
    required this.salesToday,
    required this.outstanding,
    required this.cashBalance,
    required this.workload,
    required this.readyWaiting,
  });

  final int ordersToday;
  final int salesToday;
  final int outstanding;
  final int cashBalance;
  final List<WorkloadItem> workload;
  final List<ReadyWaitingItem> readyWaiting;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      DashboardSummary(
        ordersToday: (json["orders_today"] as num?)?.toInt() ?? 0,
        salesToday: (json["sales_today"] as num?)?.toInt() ?? 0,
        outstanding: (json["outstanding"] as num?)?.toInt() ?? 0,
        cashBalance: (json["cash_balance"] as num?)?.toInt() ?? 0,
        workload: (json["workload"] as List? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(WorkloadItem.fromJson)
            .toList(),
        readyWaiting: (json["ready_waiting"] as List? ?? const [])
            .whereType<Map<String, dynamic>>()
            .map(ReadyWaitingItem.fromJson)
            .toList(),
      );
}

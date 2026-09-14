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

class WorkloadItem {
  const WorkloadItem({required this.status, required this.count});

  final String status;
  final int count;

  factory WorkloadItem.fromJson(Map<String, dynamic> json) => WorkloadItem(
        status: json["status"] as String? ?? "-",
        count: (json["count"] as num?)?.toInt() ?? 0,
      );
}

class ReadyWaitingItem {
  const ReadyWaitingItem({
    required this.ticket,
    required this.customerName,
    required this.hoursWaiting,
  });

  final String ticket;
  final String customerName;
  final int hoursWaiting;

  factory ReadyWaitingItem.fromJson(Map<String, dynamic> json) =>
      ReadyWaitingItem(
        ticket: json["ticket"] as String? ?? "-",
        customerName: json["customer_name"] as String? ?? "-",
        hoursWaiting: (json["hours_waiting"] as num?)?.toInt() ?? 0,
      );
}

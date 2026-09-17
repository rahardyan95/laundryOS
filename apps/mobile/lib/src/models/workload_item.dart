class WorkloadItem {
  const WorkloadItem({required this.status, required this.count});

  final String status;
  final int count;

  factory WorkloadItem.fromJson(Map<String, dynamic> json) => WorkloadItem(
        status: json["status"] as String? ?? "-",
        count: (json["count"] as num?)?.toInt() ?? 0,
      );
}

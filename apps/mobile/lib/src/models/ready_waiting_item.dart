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

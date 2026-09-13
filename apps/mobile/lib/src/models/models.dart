class Order {
  const Order({
    required this.id,
    required this.ticket,
    required this.status,
    required this.customerName,
    required this.total,
    required this.paidAmount,
  });

  final String id;
  final String ticket;
  final String status;
  final String customerName;
  final int total;
  final int paidAmount;

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json["id"].toString(),
      ticket: json["ticket"] as String,
      status: json["status"] as String,
      customerName: (json["customer_name"] ?? json["customer"]?["name"] ?? "-") as String,
      total: (json["total"] as num).toInt(),
      paidAmount: (json["paid_amount"] as num).toInt(),
    );
  }
}

class SessionPayload {
  const SessionPayload({
    required this.userId,
    required this.name,
    required this.role,
    required this.tenantId,
    required this.outletId,
  });

  final String userId;
  final String name;
  final String role;
  final String tenantId;
  final String outletId;

  factory SessionPayload.fromMeJson(Map<String, dynamic> json) {
    final user = json["user"] as Map<String, dynamic>;
    final tenant = json["tenant"] as Map<String, dynamic>;
    return SessionPayload(
      userId: user["id"].toString(),
      name: user["name"] as String,
      role: user["role"] as String,
      tenantId: tenant["id"].toString(),
      outletId: (user["outlet_id"] ?? "").toString(),
    );
  }
}

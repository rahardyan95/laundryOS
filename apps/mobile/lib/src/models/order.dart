enum OrderStatus {
  received,
  washing,
  drying,
  ironing,
  ready,
  completed,
  cancelled;

  static OrderStatus fromWire(String value) {
    return OrderStatus.values.firstWhere(
      (status) => status.name == value,
      orElse: () => OrderStatus.received,
    );
  }
}

class Order {
  const Order({
    required this.id,
    required this.ticket,
    required this.status,
    required this.customerName,
    required this.total,
    required this.paidAmount,
    required this.paymentStatus,
  });

  final String id;
  final String ticket;
  final OrderStatus status;
  final String customerName;
  final int total;
  final int paidAmount;
  final String paymentStatus;

  factory Order.fromJson(Map<String, dynamic> json) {
    final customer = json["customer"];
    return Order(
      id: json["id"].toString(),
      ticket: json["ticket"] as String? ?? "-",
      status: OrderStatus.fromWire(json["status"] as String? ?? "received"),
      customerName: (json["customer_name"] as String?) ??
          (customer is Map<String, dynamic> ? customer["name"] as String? : null) ??
          "-",
      total: (json["total"] as num?)?.toInt() ?? 0,
      paidAmount: (json["paid_amount"] as num?)?.toInt() ?? 0,
      paymentStatus: json["payment_status"] as String? ?? "unpaid",
    );
  }
}

class OrderPage {
  const OrderPage({required this.orders, required this.currentPage, required this.lastPage});

  final List<Order> orders;
  final int currentPage;
  final int lastPage;

  bool get hasMore => currentPage < lastPage;

  factory OrderPage.fromEnvelope(Map<String, dynamic> body) {
    final data = (body["data"] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Order.fromJson)
        .toList();
    final meta = body["meta"];
    final current = meta is Map ? (meta["current_page"] as num?)?.toInt() ?? 1 : 1;
    final last = meta is Map ? (meta["last_page"] as num?)?.toInt() ?? 1 : 1;
    return OrderPage(orders: data, currentPage: current, lastPage: last);
  }
}

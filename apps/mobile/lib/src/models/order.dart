import "order_status.dart";

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
          (customer is Map<String, dynamic>
              ? customer["name"] as String?
              : null) ??
          "-",
      total: (json["total"] as num?)?.toInt() ?? 0,
      paidAmount: (json["paid_amount"] as num?)?.toInt() ?? 0,
      paymentStatus: json["payment_status"] as String? ?? "unpaid",
    );
  }
}

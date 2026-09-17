import "order.dart";

class OrderPage {
  const OrderPage(
      {required this.orders,
      required this.currentPage,
      required this.lastPage});

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
    final current =
        meta is Map ? (meta["current_page"] as num?)?.toInt() ?? 1 : 1;
    final last = meta is Map ? (meta["last_page"] as num?)?.toInt() ?? 1 : 1;
    return OrderPage(orders: data, currentPage: current, lastPage: last);
  }
}

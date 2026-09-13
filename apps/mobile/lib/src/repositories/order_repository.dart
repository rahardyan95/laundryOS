import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../models/order.dart";

class OrderRepository {
  OrderRepository(this._api, this._tokenProvider);

  final ApiClient _api;
  final Future<String?> Function() _tokenProvider;

  Future<OrderPage> page({int page = 1, OrderStatus? status}) async {
    final token = await _requireToken();
    return _api.listOrders(token, page: page, status: status);
  }

  Future<Order> advance(String orderId, {String? note}) async {
    final token = await _requireToken();
    return _api.advanceOrderStatus(token, orderId, note: note);
  }

  Future<Order> cancel(String orderId, {String? note}) async {
    final token = await _requireToken();
    return _api.cancelOrder(token, orderId, note: note);
  }

  Future<String> _requireToken() async {
    final token = await _tokenProvider();
    if (token == null) throw ApiException(401, "Sesi berakhir. Silakan masuk kembali.");
    return token;
  }
}

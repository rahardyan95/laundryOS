import "../models/order.dart";
import "api_exception.dart";
import "api_transport.dart";

class ApiClient {
  ApiClient(this._transport);

  final ApiTransport _transport;

  ApiResponse _ensure(ApiResponse response) {
    if (response.isSuccess) return response;
    final map = response.asMap;
    throw ApiException(
      response.statusCode,
      map["message"] as String? ?? "Permintaan gagal (${response.statusCode}).",
      errors: map["errors"] is Map<String, dynamic>
          ? map["errors"] as Map<String, dynamic>
          : null,
    );
  }

  Future<Map<String, dynamic>> login(String email, String password, String deviceName) async {
    final response = await _transport.post(
      "/auth/login",
      body: {"email": email, "password": password, "device_name": deviceName},
    );
    return _ensure(response).asMap;
  }

  Future<Map<String, dynamic>> me(String token) async {
    final response = await _transport.get("/auth/me", token: token);
    return _ensure(response).asMap;
  }

  Future<void> logout(String token) async {
    await _transport.post("/auth/logout", token: token);
  }

  Future<OrderPage> listOrders(
    String token, {
    int page = 1,
    OrderStatus? status,
  }) async {
    final response = await _transport.get(
      "/orders",
      query: {
        "page": "$page",
        if (status != null) "status": status.name,
      },
      token: token,
    );
    return OrderPage.fromEnvelope(_ensure(response).asMap);
  }

  Future<Order> advanceOrderStatus(String token, String orderId, {String? note}) async {
    final response = await _transport.post(
      "/orders/$orderId/status",
      body: note == null || note.isEmpty ? null : {"note": note},
      token: token,
    );
    return _orderFrom(_ensure(response).asMap);
  }

  Future<Order> cancelOrder(String token, String orderId, {String? note}) async {
    final response = await _transport.post(
      "/orders/$orderId/cancel",
      body: note == null || note.isEmpty ? null : {"note": note},
      token: token,
    );
    return _orderFrom(_ensure(response).asMap);
  }

  Order _orderFrom(Map<String, dynamic> body) {
    final data = body["data"];
    if (data is Map<String, dynamic>) return Order.fromJson(data);
    throw ApiException(500, "Format respons order tidak dikenali.");
  }
}

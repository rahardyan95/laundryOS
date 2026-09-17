import "../models/catalog.dart";
import "../models/service.dart";
import "../models/dashboard.dart";
import "../models/delivery_task.dart";
import "../models/delivery_task_page.dart";
import "../models/delivery_task_status.dart";
import "../models/notification.dart";
import "../models/order.dart";
import "../models/order_page.dart";
import "../models/order_status.dart";
import "api_exception.dart";
import "api_transport.dart";
import "upload_file.dart";

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

  /// Memetakan envelope koleksi (`{"data": [...]}`) menjadi daftar model bertipe.
  /// Rantai `whereType(...).map(...)` harus dimulai dari nilai bertipe statis —
  /// bila lewat `dynamic`, hasilnya `List<dynamic>` dan gagal type-check runtime.
  List<T> _collection<T>(
      ApiResponse response, T Function(Map<String, dynamic>) fromJson) {
    final data = _ensure(response).asMap["data"];
    if (data is! List) return const [];
    return data.whereType<Map<String, dynamic>>().map(fromJson).toList();
  }

  // --- Auth ---

  Future<Map<String, dynamic>> login(
      String email, String password, String deviceName) async {
    final response = await _transport.post(
      "/auth/login",
      body: {"email": email, "password": password, "device_name": deviceName},
    );
    return _ensure(response).asMap;
  }

  Future<Map<String, dynamic>> me(String token) async {
    return _ensure(await _transport.get("/auth/me", token: token)).asMap;
  }

  Future<void> logout(String token) async {
    await _transport.post("/auth/logout", token: token);
  }

  /// Mendaftarkan token perangkat (FCM) milik sesi ini. Server melakukan
  /// `updateOrCreate` per token, jadi memanggil ulang aman.
  Future<void> registerDeviceToken(
    String token,
    String deviceToken, {
    String platform = "android",
  }) async {
    _ensure(await _transport.post(
      "/auth/device-token",
      body: {"token": deviceToken, "platform": platform},
      token: token,
    ));
  }

  /// Menghapus token perangkat. Server hanya butuh token perangkatnya; ia
  /// mencari baris milik pengguna yang sedang masuk.
  Future<void> deleteDeviceToken(String token, String deviceToken) async {
    _ensure(await _transport.delete(
      "/auth/device-token",
      body: {"token": deviceToken},
      token: token,
    ));
  }

  // --- Orders ---

  Future<OrderPage> listOrders(
    String token, {
    int page = 1,
    OrderStatus? status,
  }) async {
    final response = await _transport.get(
      "/orders",
      query: {"page": "$page", if (status != null) "status": status.name},
      token: token,
    );
    return OrderPage.fromEnvelope(_ensure(response).asMap);
  }

  Future<Order> createOrder(
    String token, {
    required String outletId,
    required String customerId,
    required List<({String serviceId, double qty})> items,
    required int paidAmount,
    String? paymentMethod,
    String? note,
  }) async {
    final response = await _transport.post(
      "/orders",
      body: {
        "outlet_id": int.parse(outletId),
        "customer_id": int.parse(customerId),
        "items": items
            .map((item) =>
                {"service_id": int.parse(item.serviceId), "qty": item.qty})
            .toList(),
        "paid_amount": paidAmount,
        "payment_method": paidAmount > 0 ? paymentMethod : null,
        "note": note,
      },
      token: token,
    );
    return _orderFrom(_ensure(response).asMap);
  }

  Future<Order> advanceOrderStatus(String token, String orderId,
      {String? note}) async {
    final response = await _transport.post(
      "/orders/$orderId/status",
      body: note == null || note.isEmpty ? null : {"note": note},
      token: token,
    );
    return _orderFrom(_ensure(response).asMap);
  }

  Future<Order> cancelOrder(String token, String orderId,
      {String? note}) async {
    final response = await _transport.post(
      "/orders/$orderId/cancel",
      body: note == null || note.isEmpty ? null : {"note": note},
      token: token,
    );
    return _orderFrom(_ensure(response).asMap);
  }

  // --- Catalog ---

  Future<List<Customer>> listCustomers(String token, {String? query}) async {
    final response = await _transport.get(
      "/customers",
      query: {
        "per_page": "100",
        if (query != null && query.isNotEmpty) "q": query
      },
      token: token,
    );
    return _collection(response, Customer.fromJson);
  }

  Future<List<Service>> listServices(String token) async {
    final response = await _transport.get("/services",
        query: {"per_page": "100"}, token: token);
    return _collection(response, Service.fromJson);
  }

  // --- Delivery tasks ---

  Future<DeliveryTaskPage> listDeliveryTasks(String token,
      {int page = 1}) async {
    final response = await _transport.get(
      "/delivery-tasks",
      query: {"page": "$page"},
      token: token,
    );
    return DeliveryTaskPage.fromEnvelope(_ensure(response).asMap);
  }

  Future<DeliveryTask> advanceDeliveryTask(
    String token,
    String taskId,
    DeliveryTaskStatus status,
  ) async {
    final response = await _transport.post(
      "/delivery-tasks/$taskId/status",
      body: {"status": status.wire},
      token: token,
    );
    return _taskFrom(_ensure(response).asMap);
  }

  Future<DeliveryTask> uploadDeliveryProof(
    String token,
    String taskId, {
    required List<int> bytes,
    required String filename,
  }) async {
    final response = await _transport.postMultipart(
      "/delivery-tasks/$taskId/proof",
      files: {"proof": UploadFile(filename: filename, bytes: bytes)},
      token: token,
    );
    return _taskFrom(_ensure(response).asMap);
  }

  // --- Notifications ---

  Future<List<AppNotification>> listNotifications(String token) async {
    final response = await _transport.get(
      "/notifications",
      query: {"per_page": "50"},
      token: token,
    );
    return _collection(response, AppNotification.fromJson);
  }

  Future<int> unreadCount(String token) async {
    final response =
        await _transport.get("/notifications/unread-count", token: token);
    final data = _ensure(response).asMap["data"];
    return data is Map ? (data["unread"] as num?)?.toInt() ?? 0 : 0;
  }

  Future<void> markNotificationRead(String token, String id) async {
    await _transport.post("/notifications/$id/read", token: token);
  }

  // --- Dashboard ---

  Future<DashboardSummary> dashboardSummary(String token,
      {String? outletId}) async {
    final response = await _transport.get(
      "/dashboard/summary",
      query:
          outletId == null || outletId.isEmpty ? null : {"outlet_id": outletId},
      token: token,
    );
    final data = _ensure(response).asMap["data"];
    if (data is Map<String, dynamic>) return DashboardSummary.fromJson(data);
    throw ApiException(500, "Format respons dashboard tidak dikenali.");
  }

  Order _orderFrom(Map<String, dynamic> body) {
    final data = body["data"];
    if (data is Map<String, dynamic>) return Order.fromJson(data);
    throw ApiException(500, "Format respons order tidak dikenali.");
  }

  DeliveryTask _taskFrom(Map<String, dynamic> body) {
    final data = body["data"];
    if (data is Map<String, dynamic>) return DeliveryTask.fromJson(data);
    throw ApiException(500, "Format respons task tidak dikenali.");
  }
}

import "dart:convert";

import "package:http/http.dart" as http;

import "../config/app_config.dart";
import "../models/models.dart";
import "session_manager.dart";

class ApiException implements Exception {
  ApiException(this.status, this.message);

  final int status;
  final String message;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final http.Client _client = http.Client();

  Map<String, String> _headers(String? token) => {
        "Accept": "application/json",
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      };

  Future<Map<String, dynamic>> _decode(http.Response response) async {
    final body = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw ApiException(
        response.statusCode,
        (body["message"] ?? "Permintaan gagal (${response.statusCode}).") as String,
      );
    }
    return body;
  }

  Future<void> login(String email, String password, String deviceName) async {
    final response = await _client.post(
      Uri.parse("${AppConfig.apiBaseUrl}/auth/login"),
      headers: _headers(null),
      body: jsonEncode({"email": email, "password": password, "device_name": deviceName}),
    );
    final body = await _decode(response);
    final token = body["token"] as String;
    await SessionManager.instance.saveToken(token);

    final me = await _client.get(
      Uri.parse("${AppConfig.apiBaseUrl}/auth/me"),
      headers: _headers(token),
    );
    final meBody = await _decode(me);
    await SessionManager.instance.saveUser(jsonEncode(meBody));
  }

  Future<SessionPayload> me() async {
    final token = await SessionManager.instance.token();
    final response = await _client.get(
      Uri.parse("${AppConfig.apiBaseUrl}/auth/me"),
      headers: _headers(token),
    );
    return SessionPayload.fromMeJson(await _decode(response));
  }

  Future<List<Order>> listOrders({String? status}) async {
    final token = await SessionManager.instance.token();
    final query = status != null ? "?status=$status" : "";
    final response = await _client.get(
      Uri.parse("${AppConfig.apiBaseUrl}/orders$query"),
      headers: _headers(token),
    );
    final body = await _decode(response);
    final data = (body["data"] as List).cast<Map<String, dynamic>>();
    return data.map(Order.fromJson).toList();
  }

  Future<Order> advanceOrderStatus(String orderId) async {
    final token = await SessionManager.instance.token();
    final response = await _client.post(
      Uri.parse("${AppConfig.apiBaseUrl}/orders/$orderId/status"),
      headers: _headers(token),
    );
    final body = await _decode(response);
    return Order.fromJson(body["data"] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final token = await SessionManager.instance.token();
    if (token != null) {
      try {
        await _client.post(
          Uri.parse("${AppConfig.apiBaseUrl}/auth/logout"),
          headers: _headers(token),
        );
      } finally {
        await SessionManager.instance.clear();
      }
    }
  }
}

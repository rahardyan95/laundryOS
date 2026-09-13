import "dart:convert";

import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../api/session_store.dart";
import "../models/session.dart";

class AuthRepository {
  AuthRepository(this._api, this._store);

  final ApiClient _api;
  final SessionStore _store;

  Future<SessionPayload> login(String email, String password) async {
    final body = await _api.login(email, password, "mobile");
    final token = body["token"] as String?;
    if (token == null || token.isEmpty) {
      throw ApiException(500, "Token tidak diterima dari server.");
    }
    await _store.saveToken(token);

    final meBody = await _api.me(token);
    await _store.saveUser(jsonEncode(meBody));

    final payload = SessionPayload.fromMeJson(meBody);
    await _store.saveOutlet(payload.outletId);
    return payload;
  }

  Future<SessionPayload?> restore() async {
    final token = await _store.token();
    if (token == null) return null;
    try {
      final meBody = await _api.me(token);
      await _store.saveUser(jsonEncode(meBody));
      return SessionPayload.fromMeJson(meBody);
    } on ApiException catch (error) {
      if (error.isUnauthorized) {
        await _store.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<void> logout() async {
    final token = await _store.token();
    try {
      if (token != null) await _api.logout(token);
    } finally {
      await _store.clear();
    }
  }
}

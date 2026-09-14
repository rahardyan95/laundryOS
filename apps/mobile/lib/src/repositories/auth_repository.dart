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
    await _store.saveUserId(payload.userId);
    await _store.saveOutlet(payload.outletId);
    return payload;
  }

  Future<SessionPayload?> restore() async {
    final token = await _store.token();
    if (token == null) return null;
    try {
      final meBody = await _api.me(token);
      await _store.saveUser(jsonEncode(meBody));
      final payload = SessionPayload.fromMeJson(meBody);
      await _store.saveUserId(payload.userId);
      return payload;
    } on ApiException catch (error) {
      if (error.isUnauthorized) {
        await _store.clear();
        return null;
      }
      rethrow;
    }
  }

  /// Keluar selalu selesai di sisi lokal. Pencabutan token di server bersifat
  /// best-effort: saat offline, sesi lokal tetap harus berakhir supaya pemanggil
  /// (yang lalu mengosongkan cache dan antrean) tidak terjebak setengah jalan.
  Future<void> logout() async {
    final token = await _store.token();
    try {
      if (token != null) await _api.logout(token);
    } on Exception {
      // Server tidak terhubung atau menolak token ini; sesi lokal tetap dibersihkan.
    } finally {
      await _store.clear();
    }
  }

  /// Mendaftarkan token perangkat untuk sesi yang sedang tersimpan. Tidak
  /// melakukan apa-apa bila belum ada token sesi.
  Future<void> registerDeviceToken(String deviceToken,
      {String platform = "android"}) async {
    final token = await _store.token();
    if (token == null) return;
    await _api.registerDeviceToken(token, deviceToken, platform: platform);
  }

  /// Menghapus token perangkat dari sesi yang sedang tersimpan. Tidak melakukan
  /// apa-apa bila belum ada token sesi.
  Future<void> deleteDeviceToken(String deviceToken) async {
    final token = await _store.token();
    if (token == null) return;
    await _api.deleteDeviceToken(token, deviceToken);
  }
}

import "package:flutter/foundation.dart";

import "../api/api_exception.dart";
import "../api/mutation_queue.dart";
import "../api/offline_cache.dart";
import "../models/session.dart";
import "../push/push_registrar.dart";
import "../repositories/auth_repository.dart";

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Status sesi aplikasi. Selain menyalakan layar login, controller ini menjaga
/// batas antar-pengguna: saat keluar, cache offline dan antrean mutasi dibuang,
/// dan token perangkat dihapus lebih dulu (masih butuh sesi yang berlaku).
class AuthController extends ChangeNotifier {
  AuthController(
    this._repository, {
    required OfflineCache offlineCache,
    required MutationQueue mutationQueue,
    required PushRegistrar pushRegistrar,
    String? platform,
  })  : _offlineCache = offlineCache,
        _mutationQueue = mutationQueue,
        _pushRegistrar = pushRegistrar,
        _platform = platform ?? platformFor(defaultTargetPlatform);

  final AuthRepository _repository;
  final OfflineCache _offlineCache;
  final MutationQueue _mutationQueue;
  final PushRegistrar _pushRegistrar;
  final String _platform;

  AuthStatus _status = AuthStatus.unknown;
  SessionPayload? _session;

  AuthStatus get status => _status;
  SessionPayload? get session => _session;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  /// Platform yang dilaporkan ke server saat mendaftarkan token perangkat.
  static String platformFor(TargetPlatform target) =>
      target == TargetPlatform.iOS ? "ios" : "android";

  Future<void> bootstrap() async {
    try {
      final session = await _repository.restore();
      _session = session;
      _status = session == null
          ? AuthStatus.unauthenticated
          : AuthStatus.authenticated;
    } on Exception {
      // Jaringan bermasalah saat start: tetap anggap belum masuk, jangan crash.
      _session = null;
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
    if (_status == AuthStatus.authenticated) {
      await _registerPushToken();
    }
  }

  Future<void> login(String email, String password) async {
    _session = await _repository.login(email, password);
    _status = AuthStatus.authenticated;
    notifyListeners();
    await _registerPushToken();
  }

  Future<void> logout() async {
    // Hapus token perangkat dulu: sesudah `_repository.logout()` token sesi
    // sudah tidak ada. Best-effort — gagal jaringan tidak menahan keluar.
    final deviceToken = await _pushRegistrar.currentToken();
    if (deviceToken != null) {
      try {
        await _repository.deleteDeviceToken(deviceToken);
      } on ApiException {
        // Token kedaluwarsa sendiri di server.
      } on NetworkException {
        // Sedang offline; tidak menghalangi keluar.
      }
    }

    await _repository.logout();
    // Cache dan antrean milik pengguna yang keluar tidak boleh tertinggal untuk
    // pengguna berikutnya di perangkat yang sama.
    await _offlineCache.clear();
    await _mutationQueue.clear();
    _session = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Best-effort: kegagalan push tidak boleh menggagalkan login/restore.
  Future<void> _registerPushToken() async {
    final deviceToken = await _pushRegistrar.currentToken();
    if (deviceToken == null) return;
    try {
      await _repository.registerDeviceToken(deviceToken, platform: _platform);
    } on ApiException {
      // Server belum siap menerima token; percobaan berikutnya saat masuk lagi.
    } on NetworkException {
      // Offline; token akan didaftarkan pada login berikutnya.
    }
  }
}

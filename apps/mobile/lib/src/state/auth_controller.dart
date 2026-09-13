import "package:flutter/foundation.dart";

import "../models/session.dart";
import "../repositories/auth_repository.dart";

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;

  AuthStatus _status = AuthStatus.unknown;
  SessionPayload? _session;

  AuthStatus get status => _status;
  SessionPayload? get session => _session;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> bootstrap() async {
    try {
      final session = await _repository.restore();
      _session = session;
      _status = session == null ? AuthStatus.unauthenticated : AuthStatus.authenticated;
    } catch (_) {
      // Jaringan bermasalah saat start: tetap anggap belum masuk, jangan crash.
      _session = null;
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _session = await _repository.login(email, password);
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.logout();
    _session = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}

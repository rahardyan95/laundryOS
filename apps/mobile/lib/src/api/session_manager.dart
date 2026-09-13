import "package:flutter_secure_storage/flutter_secure_storage.dart";

class SessionManager {
  SessionManager._();

  static final SessionManager instance = SessionManager._();

  static const _tokenKey = "laundryos.token";
  static const _userKey = "laundryos.user";
  static const _outletKey = "laundryos.outlet";

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<String?> token() => _storage.read(key: _tokenKey);

  Future<void> saveOutlet(String outletId) => _storage.write(key: _outletKey, value: outletId);

  Future<String?> outletId() => _storage.read(key: _outletKey);

  Future<void> saveUser(String json) => _storage.write(key: _userKey, value: json);

  Future<String?> user() => _storage.read(key: _userKey);

  Future<bool> get isLoggedIn async => (await token()) != null;

  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    await _storage.delete(key: _outletKey);
  }
}

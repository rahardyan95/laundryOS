import "package:flutter_secure_storage/flutter_secure_storage.dart";

abstract class SessionStore {
  Future<String?> token();
  Future<void> saveToken(String token);
  Future<String?> user();
  Future<void> saveUser(String json);
  Future<String?> outletId();
  Future<void> saveOutlet(String outletId);
  Future<void> clear();
}

class SecureSessionStore implements SessionStore {
  SecureSessionStore([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  static const _tokenKey = "laundryos.token";
  static const _userKey = "laundryos.user";
  static const _outletKey = "laundryos.outlet";

  final FlutterSecureStorage _storage;

  @override
  Future<String?> token() => _storage.read(key: _tokenKey);

  @override
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);

  @override
  Future<String?> user() => _storage.read(key: _userKey);

  @override
  Future<void> saveUser(String json) => _storage.write(key: _userKey, value: json);

  @override
  Future<String?> outletId() => _storage.read(key: _outletKey);

  @override
  Future<void> saveOutlet(String outletId) => _storage.write(key: _outletKey, value: outletId);

  @override
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
    await _storage.delete(key: _outletKey);
  }
}

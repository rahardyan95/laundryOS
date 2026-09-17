import "offline_cache.dart";

/// Cache dalam memori untuk test.
class InMemoryOfflineCache implements OfflineCache {
  final Map<String, String> _store = {};

  /// Kunci yang tersimpan; dipakai test untuk memeriksa `clear()` tanpa
  /// membuka isi cache.
  Iterable<String> get keys => _store.keys;

  @override
  Future<String?> read(String key) async => _store[key];

  @override
  Future<void> write(String key, String value) async => _store[key] = value;

  @override
  Future<void> clear() async => _store.clear();
}

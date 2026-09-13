import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

/// Cache respons GET terakhir agar aplikasi tetap menampilkan data saat offline.
abstract class OfflineCache {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class SharedPrefsOfflineCache implements OfflineCache {
  static const _prefix = "laundryos.cache.";

  @override
  Future<String?> read(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString("$_prefix$key");
  }

  @override
  Future<void> write(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("$_prefix$key", value);
  }
}

/// Cache dalam memori untuk test.
class InMemoryOfflineCache implements OfflineCache {
  final Map<String, String> _store = {};

  @override
  Future<String?> read(String key) async => _store[key];

  @override
  Future<void> write(String key, String value) async => _store[key] = value;
}

class CacheCodec {
  const CacheCodec._();

  static String encode(Object? body) => jsonEncode({"body": body});

  static Object? decode(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded["body"];
      return null;
    } catch (_) {
      return null;
    }
  }
}

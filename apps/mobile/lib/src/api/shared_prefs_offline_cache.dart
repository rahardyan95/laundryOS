import "package:shared_preferences/shared_preferences.dart";

import "offline_cache.dart";

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

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    for (final key
        in prefs.getKeys().where((key) => key.startsWith(_prefix)).toList()) {
      await prefs.remove(key);
    }
  }
}

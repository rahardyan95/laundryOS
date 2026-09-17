import "dart:convert";

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

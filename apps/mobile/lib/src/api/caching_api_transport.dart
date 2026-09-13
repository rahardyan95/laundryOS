import "api_exception.dart";
import "api_transport.dart";
import "offline_cache.dart";

/// Dekorator transport: menyimpan respons GET sukses dan mengembalikannya bila
/// jaringan gagal (mode offline baca-saja). Mutasi tetap diteruskan apa adanya.
class CachingApiTransport implements ApiTransport {
  CachingApiTransport(this._inner, this._cache);

  final ApiTransport _inner;
  final OfflineCache _cache;

  String _key(String path, Map<String, String>? query) {
    final entries = (query ?? const {}).entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final suffix = entries.map((e) => "${e.key}=${e.value}").join("&");
    return suffix.isEmpty ? path : "$path?$suffix";
  }

  @override
  Future<ApiResponse> get(String path, {Map<String, String>? query, String? token}) async {
    final key = _key(path, query);
    try {
      final response = await _inner.get(path, query: query, token: token);
      if (response.isSuccess) {
        await _cache.write(key, CacheCodec.encode(response.body));
      }
      return response;
    } on NetworkException {
      final cached = await _cache.read(key);
      if (cached == null) rethrow;
      return ApiResponse(200, CacheCodec.decode(cached));
    }
  }

  @override
  Future<ApiResponse> post(String path, {Object? body, String? token}) =>
      _inner.post(path, body: body, token: token);

  @override
  Future<ApiResponse> patch(String path, {Object? body, String? token}) =>
      _inner.patch(path, body: body, token: token);

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, List<int>> files = const {},
    String? token,
  }) =>
      _inner.postMultipart(path, fields: fields, files: files, token: token);

  @override
  void close() => _inner.close();
}

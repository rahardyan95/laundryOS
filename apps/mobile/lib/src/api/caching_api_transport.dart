import "api_exception.dart";
import "api_transport.dart";
import "offline_cache.dart";
import "upload_file.dart";

/// Dekorator transport: menyimpan respons GET sukses dan mengembalikannya bila
/// jaringan gagal (mode offline baca-saja). Mutasi tetap diteruskan apa adanya.
///
/// Cache terikat pada [identity] (id pengguna yang sedang masuk), bukan hanya
/// pada path: perangkat laundry dipakai bergantian shift, dan data pesanan satu
/// pengguna tidak boleh muncul untuk pengguna berikutnya. Saat belum masuk
/// (identitas null) tidak ada yang ditulis maupun dibaca dari cache.
class CachingApiTransport implements ApiTransport {
  CachingApiTransport(this._inner, this._cache, this._identity);

  final ApiTransport _inner;
  final OfflineCache _cache;
  final Future<String?> Function() _identity;

  String _key(String userId, String path, Map<String, String>? query) {
    final entries = (query ?? const {}).entries.toList()
      ..sort((a, b) => a.key.compareTo(b.key));
    final suffix = entries.map((e) => "${e.key}=${e.value}").join("&");
    final request = suffix.isEmpty ? path : "$path?$suffix";
    return "u$userId|$request";
  }

  @override
  Future<ApiResponse> get(String path,
      {Map<String, String>? query, String? token}) async {
    final userId = await _identity();
    if (userId == null) {
      return _inner.get(path, query: query, token: token);
    }

    final key = _key(userId, path, query);
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
  Future<ApiResponse> post(String path,
          {Object? body, String? token, String? idempotencyKey}) =>
      _inner.post(path,
          body: body, token: token, idempotencyKey: idempotencyKey);

  @override
  Future<ApiResponse> patch(String path,
          {Object? body, String? token, String? idempotencyKey}) =>
      _inner.patch(path,
          body: body, token: token, idempotencyKey: idempotencyKey);

  @override
  Future<ApiResponse> delete(String path, {Object? body, String? token}) =>
      _inner.delete(path, body: body, token: token);

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) =>
      _inner.postMultipart(path, fields: fields, files: files, token: token);

  @override
  void close() => _inner.close();
}

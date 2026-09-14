import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/upload_file.dart";

class FakeTransport implements ApiTransport {
  final List<ApiResponse> _queue = [];
  final List<Object> _errors = [];
  final List<String> calls = [];
  final List<String?> idempotencyKeys = [];

  /// Body setiap panggilan, sejajar dengan [calls]. Dipakai test untuk
  /// memeriksa isi muatan tanpa mengintip transport.
  final List<Object?> bodies = [];

  void enqueue(ApiResponse response) => _queue.add(response);

  void enqueueError(Object error) => _errors.add(error);

  ApiResponse _next(String method, String path, String? idempotencyKey,
      [Object? body]) {
    calls.add("$method $path");
    idempotencyKeys.add(idempotencyKey);
    bodies.add(body);
    if (_errors.isNotEmpty) {
      throw _errors.removeAt(0);
    }
    if (_queue.isEmpty) {
      throw StateError("FakeTransport: tidak ada respons untuk $method $path");
    }
    return _queue.removeAt(0);
  }

  @override
  Future<ApiResponse> get(String path,
          {Map<String, String>? query, String? token}) async =>
      _next("GET", path, null);

  @override
  Future<ApiResponse> post(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) async =>
      _next("POST", path, idempotencyKey, body);

  @override
  Future<ApiResponse> patch(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) async =>
      _next("PATCH", path, idempotencyKey, body);

  @override
  Future<ApiResponse> delete(String path,
          {Object? body, String? token}) async =>
      _next("DELETE", path, null, body);

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) async =>
      _next("POST", path, null);

  @override
  void close() {}
}

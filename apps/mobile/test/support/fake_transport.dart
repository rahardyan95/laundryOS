import "package:laundryos_mobile/src/api/api_transport.dart";

class FakeTransport implements ApiTransport {
  final List<ApiResponse> _queue = [];
  final List<String> calls = [];

  void enqueue(ApiResponse response) => _queue.add(response);

  ApiResponse _next(String method, String path) {
    calls.add("$method $path");
    if (_queue.isEmpty) {
      throw StateError("FakeTransport: tidak ada respons untuk $method $path");
    }
    return _queue.removeAt(0);
  }

  @override
  Future<ApiResponse> get(String path, {Map<String, String>? query, String? token}) async =>
      _next("GET", path);

  @override
  Future<ApiResponse> post(String path, {Object? body, String? token}) async =>
      _next("POST", path);

  @override
  Future<ApiResponse> patch(String path, {Object? body, String? token}) async =>
      _next("PATCH", path);

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, List<int>> files = const {},
    String? token,
  }) async =>
      _next("POST", path);

  @override
  void close() {}
}

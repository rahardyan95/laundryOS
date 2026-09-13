class ApiResponse {
  const ApiResponse(this.statusCode, this.body);

  final int statusCode;
  final Object? body;

  bool get isSuccess => statusCode >= 200 && statusCode < 300;

  Map<String, dynamic> get asMap {
    final value = body;
    if (value is Map<String, dynamic>) return value;
    return const <String, dynamic>{};
  }

  List<dynamic> get asList {
    final value = body;
    if (value is List) return value;
    return const <dynamic>[];
  }
}

/// Kontrak transport HTTP. Implementasi konkret di `HttpApiTransport`;
/// test memakai fake tanpa jaringan.
abstract class ApiTransport {
  Future<ApiResponse> get(
    String path, {
    Map<String, String>? query,
    String? token,
  });

  Future<ApiResponse> post(
    String path, {
    Object? body,
    String? token,
  });

  Future<ApiResponse> patch(
    String path, {
    Object? body,
    String? token,
  });

  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields,
    Map<String, List<int>> files,
    String? token,
  });

  void close();
}

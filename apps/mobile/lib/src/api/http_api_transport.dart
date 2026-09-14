import "dart:convert";

import "package:http/http.dart" as http;

import "api_exception.dart";
import "api_transport.dart";
import "upload_file.dart";

class HttpApiTransport implements ApiTransport {
  HttpApiTransport({
    required this.baseUrl,
    http.Client? client,
    this.timeout = const Duration(seconds: 20),
  }) : _client = client ?? http.Client();

  final String baseUrl;
  final Duration timeout;
  final http.Client _client;

  Map<String, String> _headers(String? token, {String? idempotencyKey}) => {
        "Accept": "application/json",
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
        if (idempotencyKey != null) "Idempotency-Key": idempotencyKey,
      };

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = baseUrl.endsWith("/")
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final uri = Uri.parse("$base$path");
    if (query == null || query.isEmpty) return uri;
    return uri.replace(queryParameters: {...uri.queryParameters, ...query});
  }

  Future<ApiResponse> _send(Future<http.Response> Function() call) async {
    try {
      final response = await call().timeout(timeout);
      final decoded = response.body.isEmpty ? null : jsonDecode(response.body);
      return ApiResponse(response.statusCode, decoded);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw NetworkException();
    }
  }

  @override
  Future<ApiResponse> get(String path,
      {Map<String, String>? query, String? token}) {
    return _send(
        () => _client.get(_uri(path, query), headers: _headers(token)));
  }

  @override
  Future<ApiResponse> post(String path,
      {Object? body, String? token, String? idempotencyKey}) {
    return _send(
      () => _client.post(
        _uri(path),
        headers: _headers(token, idempotencyKey: idempotencyKey),
        body: body == null ? null : jsonEncode(body),
      ),
    );
  }

  @override
  Future<ApiResponse> patch(String path,
      {Object? body, String? token, String? idempotencyKey}) {
    return _send(
      () => _client.patch(
        _uri(path),
        headers: _headers(token, idempotencyKey: idempotencyKey),
        body: body == null ? null : jsonEncode(body),
      ),
    );
  }

  @override
  Future<ApiResponse> delete(String path, {Object? body, String? token}) {
    return _send(
      () => _client.delete(
        _uri(path),
        headers: _headers(token),
        body: body == null ? null : jsonEncode(body),
      ),
    );
  }

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) {
    return _send(() async {
      final request = http.MultipartRequest("POST", _uri(path));
      request.headers.addAll({
        "Accept": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      });
      request.fields.addAll(fields);
      for (final entry in files.entries) {
        // filename wajib: tanpa itu PHP membaca part ini sebagai field biasa.
        request.files.add(
          http.MultipartFile.fromBytes(
            entry.key,
            entry.value.bytes,
            filename: entry.value.filename,
          ),
        );
      }
      final streamed = await _client.send(request);
      return http.Response.fromStream(streamed);
    });
  }

  @override
  void close() => _client.close();
}

import "dart:math";

import "api_exception.dart";
import "api_transport.dart";
import "mutation_queue.dart";
import "upload_file.dart";

/// Dekorator transport: mutasi yang gagal karena jaringan disimpan di antrean
/// dan dikirim ulang (dengan `Idempotency-Key` sama) saat online.
class OfflineApiTransport implements ApiTransport {
  OfflineApiTransport(this._inner, this._queue, this._tokenProvider);

  final ApiTransport _inner;
  final MutationQueue _queue;
  final Future<String?> Function() _tokenProvider;
  final Random _random = Random();
  int _counter = 0;

  String _newKey() =>
      "mob-${DateTime.now().microsecondsSinceEpoch}-${_counter++}-${_random.nextInt(1 << 31)}";

  @override
  Future<ApiResponse> get(String path, {Map<String, String>? query, String? token}) =>
      _inner.get(path, query: query, token: token);

  @override
  Future<ApiResponse> post(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) =>
      _mutate("POST", path, body, token, idempotencyKey);

  @override
  Future<ApiResponse> patch(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) =>
      _mutate("PATCH", path, body, token, idempotencyKey);

  Future<ApiResponse> _mutate(
    String method,
    String path,
    Object? body,
    String? token,
    String? idempotencyKey,
  ) async {
    final key = idempotencyKey ?? _newKey();
    try {
      return method == "PATCH"
          ? await _inner.patch(path, body: body, token: token, idempotencyKey: key)
          : await _inner.post(path, body: body, token: token, idempotencyKey: key);
    } on NetworkException {
      await _queue.enqueue(
        PendingMutation(method: method, path: path, idempotencyKey: key, body: body),
      );
      throw QueuedOfflineException();
    }
  }

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) =>
      // Berkas biner tidak diantre; unggah ulang perlu online.
      _inner.postMultipart(path, fields: fields, files: files, token: token);

  Future<List<PendingMutation>> pending() => _queue.all();

  /// Mengirim ulang antrean. Mengembalikan jumlah mutasi yang tersinkron.
  Future<int> flush() async {
    final pending = await _queue.all();
    if (pending.isEmpty) return 0;

    final token = await _tokenProvider();
    var synced = 0;

    for (final mutation in pending) {
      try {
        if (mutation.method == "PATCH") {
          await _inner.patch(
            mutation.path,
            body: mutation.body,
            token: token,
            idempotencyKey: mutation.idempotencyKey,
          );
        } else {
          await _inner.post(
            mutation.path,
            body: mutation.body,
            token: token,
            idempotencyKey: mutation.idempotencyKey,
          );
        }
        await _queue.remove(mutation.idempotencyKey);
        synced++;
      } on NetworkException {
        break; // masih offline; hentikan, sisanya nanti
      } on ApiException {
        // Ditolak server (mis. 422) — buang agar tidak mengulang selamanya.
        await _queue.remove(mutation.idempotencyKey);
      }
    }

    return synced;
  }

  @override
  void close() => _inner.close();
}

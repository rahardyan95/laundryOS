import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/api/api_exception.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/caching_api_transport.dart";
import "package:laundryos_mobile/src/api/offline_cache.dart";
import "package:laundryos_mobile/src/api/upload_file.dart";

import "support/fake_transport.dart";

class ThrowingTransport implements ApiTransport {
  @override
  Future<ApiResponse> get(String path,
      {Map<String, String>? query, String? token}) async {
    throw NetworkException();
  }

  @override
  Future<ApiResponse> post(String path,
          {Object? body, String? token, String? idempotencyKey}) async =>
      throw NetworkException();

  @override
  Future<ApiResponse> patch(String path,
          {Object? body, String? token, String? idempotencyKey}) async =>
      throw NetworkException();

  @override
  Future<ApiResponse> delete(String path,
          {Object? body, String? token}) async =>
      throw NetworkException();

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) async =>
      throw NetworkException();

  @override
  void close() {}
}

void main() {
  test("CachingApiTransport menyimpan GET sukses dan memakainya saat offline",
      () async {
    final cache = InMemoryOfflineCache();
    final online = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": [1, 2]
      }));
    final first = await CachingApiTransport(online, cache, () async => "1")
        .get("/orders");
    expect(first.body, {
      "data": [1, 2]
    });

    final offline =
        CachingApiTransport(ThrowingTransport(), cache, () async => "1");
    final second = await offline.get("/orders");
    expect(second.isSuccess, isTrue);
    expect(second.body, {
      "data": [1, 2]
    });
  });

  test("tanpa cache, offline meneruskan NetworkException", () async {
    final offline = CachingApiTransport(
        ThrowingTransport(), InMemoryOfflineCache(), () async => "1");
    expect(() => offline.get("/orders"), throwsA(isA<NetworkException>()));
  });
}

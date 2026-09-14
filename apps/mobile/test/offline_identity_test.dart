import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_exception.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/caching_api_transport.dart";
import "package:laundryos_mobile/src/api/mutation_queue.dart";
import "package:laundryos_mobile/src/api/offline_api_transport.dart";
import "package:laundryos_mobile/src/api/offline_cache.dart";
import "package:laundryos_mobile/src/api/upload_file.dart";
import "package:laundryos_mobile/src/push/push_registrar.dart";
import "package:laundryos_mobile/src/repositories/auth_repository.dart";
import "package:laundryos_mobile/src/state/auth_controller.dart";
import "package:laundryos_mobile/src/state/connectivity_controller.dart";
import "package:laundryos_mobile/src/state/sync_controller.dart";

import "support/fake_transport.dart";
import "support/in_memory_session_store.dart";

/// Transport yang selalu gagal jaringan, untuk memaksa jalur offline.
class _OfflineTransport implements ApiTransport {
  @override
  Future<ApiResponse> get(String path,
          {Map<String, String>? query, String? token}) async =>
      throw NetworkException();

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

/// Antrean yang selalu gagal menyimpan, untuk memastikan kegagalan itu terlihat.
class _FailingQueue implements MutationQueue {
  @override
  Future<List<PendingMutation>> all() async => const [];

  @override
  Future<void> enqueue(PendingMutation mutation) async =>
      throw StateError("storage penuh");

  @override
  Future<void> remove(String idempotencyKey) async {}

  @override
  Future<void> clear() async {}
}

PendingMutation _mutation({required String userId}) => PendingMutation(
      method: "POST",
      path: "/orders",
      idempotencyKey: "k-$userId",
      userId: userId,
      body: const {"a": 1},
    );

void main() {
  test("cache ditulis pengguna A tidak disajikan ke pengguna B", () async {
    final cache = InMemoryOfflineCache();
    var userId = "A";
    Future<String?> identity() async => userId;

    final online = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": [1, 2]
      }));
    final first =
        await CachingApiTransport(online, cache, identity).get("/orders");
    expect(first.body, {
      "data": [1, 2]
    });

    // Shift berganti: identitas lain, jaringan mati.
    userId = "B";
    final offline = CachingApiTransport(_OfflineTransport(), cache, identity);

    await expectLater(offline.get("/orders"), throwsA(isA<NetworkException>()));
  });

  test("belum masuk: GET tidak ditulis ke cache", () async {
    final cache = InMemoryOfflineCache();
    final online = FakeTransport()
      ..enqueue(const ApiResponse(200, {"data": []}));

    await CachingApiTransport(online, cache, () async => null).get("/orders");

    expect(cache.keys, isEmpty);
  });

  test("mutasi pengguna A tidak dikirim ulang dengan token pengguna B",
      () async {
    final inner = FakeTransport()..enqueueError(NetworkException());
    final queue = InMemoryMutationQueue();
    var userId = "A";
    var token = "tok-A";
    final transport = OfflineApiTransport(
        inner, queue, () async => token, () async => userId);

    await expectLater(
      transport.post("/orders", body: const {"a": 1}),
      throwsA(isA<QueuedOfflineException>()),
    );
    expect((await queue.all()).single.userId, "A");
    final callsBeforeFlush = inner.calls.length;

    // Sesi berganti ke B sebelum antrean tersinkron.
    userId = "B";
    token = "tok-B";
    inner.enqueue(const ApiResponse(200, {"data": {}}));

    final synced = await transport.flush();

    expect(synced, 0,
        reason: "mutasi milik A tidak boleh terkirim atas nama B");
    expect(inner.calls.length, callsBeforeFlush,
        reason: "tidak ada kiriman ulang");
    expect(await queue.all(), isEmpty, reason: "mutasi identitas lain dibuang");
  });

  test("flush saat belum masuk tidak menyentuh antrean", () async {
    final inner = FakeTransport();
    final queue = InMemoryMutationQueue();
    await queue.enqueue(_mutation(userId: "A"));
    final transport =
        OfflineApiTransport(inner, queue, () async => null, () async => null);

    expect(await transport.flush(), 0);
    expect(inner.calls, isEmpty);
    expect(await queue.all(), hasLength(1));
  });

  test("logout mengosongkan cache dan antrean", () async {
    final cache = InMemoryOfflineCache();
    final queue = InMemoryMutationQueue();
    final store = InMemorySessionStore();
    await store.saveToken("tok");
    await store.saveUserId("1");

    final online = FakeTransport()
      ..enqueue(const ApiResponse(200, {"data": []}));
    await CachingApiTransport(online, cache, store.userId).get("/orders");
    await queue.enqueue(_mutation(userId: "1"));
    expect(cache.keys, hasLength(1));
    expect(await queue.all(), hasLength(1));

    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {"message": "ok"}));
    final controller = AuthController(
      AuthRepository(ApiClient(transport), store),
      offlineCache: cache,
      mutationQueue: queue,
      pushRegistrar: const NoopPushRegistrar(),
    );

    await controller.logout();

    expect(cache.keys, isEmpty);
    expect(await queue.all(), isEmpty);
    expect(controller.status, AuthStatus.unauthenticated);
  });

  test("gagal menyimpan ke antrean tidak dilaporkan sebagai aman", () async {
    final inner = FakeTransport()..enqueueError(NetworkException());
    final transport = OfflineApiTransport(
        inner, _FailingQueue(), () async => "tok", () async => "1");

    await expectLater(
      transport.post("/orders", body: const {"a": 1}),
      throwsA(isA<StateError>()),
    );
  });

  test("logout saat offline tetap mengosongkan cache dan antrean", () async {
    final cache = InMemoryOfflineCache();
    final queue = InMemoryMutationQueue();
    final store = InMemorySessionStore();
    await store.saveToken("tok");
    await store.saveUserId("1");

    final online = FakeTransport()
      ..enqueue(const ApiResponse(200, {"data": []}));
    await CachingApiTransport(online, cache, store.userId).get("/orders");
    await queue.enqueue(_mutation(userId: "1"));

    // Semua panggilan jaringan gagal: logout tidak boleh berhenti di tengah.
    final transport = OfflineApiTransport(
        _OfflineTransport(), queue, store.token, store.userId);
    final controller = AuthController(
      AuthRepository(ApiClient(transport), store),
      offlineCache: cache,
      mutationQueue: queue,
      pushRegistrar: const NoopPushRegistrar(),
    );

    await controller.logout();

    expect(controller.status, AuthStatus.unauthenticated);
    expect(await store.token(), isNull);
    expect(cache.keys, isEmpty);
    expect(await queue.all(), isEmpty);
  });

  test("cold start yang sudah online mengirim antrean sekali", () async {
    final inner = FakeTransport();
    final queue = InMemoryMutationQueue();
    final store = InMemorySessionStore();
    await store.saveToken("tok");
    await store.saveUserId("1");
    await queue.enqueue(_mutation(userId: "1"));

    final transport =
        OfflineApiTransport(inner, queue, store.token, store.userId);
    final connectivity = ConnectivityController();
    addTearDown(connectivity.dispose);
    final sync = SyncController(transport, connectivity);
    addTearDown(sync.dispose);

    inner.enqueue(const ApiResponse(201, {"data": {}}));
    await sync.start();

    expect(inner.calls, ["POST /orders"]);
    expect(await queue.all(), isEmpty);
    expect(sync.pending, 0);
  });
}

import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/mutation_queue.dart";
import "package:laundryos_mobile/src/api/offline_cache.dart";
import "package:laundryos_mobile/src/push/push_registrar.dart";
import "package:laundryos_mobile/src/repositories/auth_repository.dart";
import "package:laundryos_mobile/src/state/auth_controller.dart";

import "support/fake_transport.dart";
import "support/in_memory_session_store.dart";

class _FakePushRegistrar implements PushRegistrar {
  _FakePushRegistrar(this._token);

  final String? _token;

  @override
  Future<String?> currentToken() async => _token;
}

AuthController _controller(
  FakeTransport transport,
  InMemorySessionStore store, {
  required PushRegistrar pushRegistrar,
}) =>
    AuthController(
      AuthRepository(ApiClient(transport), store),
      offlineCache: InMemoryOfflineCache(),
      mutationQueue: InMemoryMutationQueue(),
      pushRegistrar: pushRegistrar,
    );

const _meResponse = ApiResponse(200, {
  "user": {
    "id": 1,
    "name": "Budi",
    "email": "b@x.test",
    "role": "owner",
    "outlet_id": 2,
  },
  "tenant": {"id": 9},
  "outlets": [],
});

void main() {
  test("login mendaftarkan token perangkat milik sesi", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "token": "tok-1",
        "user": {"id": 1}
      }))
      ..enqueue(_meResponse)
      ..enqueue(
          const ApiResponse(200, {"message": "Token perangkat terdaftar."}));
    final store = InMemorySessionStore();
    final controller = _controller(transport, store,
        pushRegistrar: _FakePushRegistrar("fcm-token"));

    await controller.login("b@x.test", "secret");

    expect(transport.calls,
        ["POST /auth/login", "GET /auth/me", "POST /auth/device-token"]);
    expect(
        transport.bodies.last, {"token": "fcm-token", "platform": "android"});
  });

  test("logout menghapus token perangkat sebelum sesi dibuang", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {"message": "Token perangkat dihapus."}))
      ..enqueue(const ApiResponse(200, {"message": "ok"}));
    final store = InMemorySessionStore();
    await store.saveToken("tok-1");
    await store.saveUserId("1");
    final controller = _controller(transport, store,
        pushRegistrar: _FakePushRegistrar("fcm-token"));

    await controller.logout();

    expect(transport.calls, ["DELETE /auth/device-token", "POST /auth/logout"]);
    expect(transport.bodies.first, {"token": "fcm-token"});
    expect(await store.token(), isNull);
  });

  test("tanpa token perangkat tidak ada panggilan ke server", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "token": "tok-1",
        "user": {"id": 1}
      }))
      ..enqueue(_meResponse);
    final store = InMemorySessionStore();
    final controller =
        _controller(transport, store, pushRegistrar: const NoopPushRegistrar());

    await controller.login("b@x.test", "secret");

    expect(transport.calls, ["POST /auth/login", "GET /auth/me"]);
  });
}

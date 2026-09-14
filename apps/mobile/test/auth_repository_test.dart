import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/models/role.dart";
import "package:laundryos_mobile/src/repositories/auth_repository.dart";

import "support/fake_transport.dart";
import "support/in_memory_session_store.dart";

void main() {
  test("login menyimpan token dan mengembalikan sesi", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "token": "tok-1",
        "user": {"id": 1}
      }))
      ..enqueue(const ApiResponse(200, {
        "user": {
          "id": 1,
          "name": "Budi",
          "email": "b@x.test",
          "role": "owner",
          "outlet_id": 2
        },
        "tenant": {"id": 9},
        "outlets": [],
      }));
    final store = InMemorySessionStore();
    final repository = AuthRepository(ApiClient(transport), store);

    final session = await repository.login("b@x.test", "secret");

    expect(await store.token(), "tok-1");
    expect(session.role, Role.owner);
    expect(session.userId, "1");
  });

  test("restore mengembalikan null dan menghapus token saat 401", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(401, {"message": "Unauthenticated."}));
    final store = InMemorySessionStore();
    await store.saveToken("kedaluwarsa");
    final repository = AuthRepository(ApiClient(transport), store);

    final session = await repository.restore();

    expect(session, isNull);
    expect(await store.token(), isNull);
  });

  test("restore mengembalikan sesi saat token valid", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "user": {
          "id": 3,
          "name": "Ayu",
          "email": "a@x.test",
          "role": "cashier",
          "outlet_id": ""
        },
        "tenant": {"id": 1},
        "outlets": [],
      }));
    final store = InMemorySessionStore();
    await store.saveToken("tok");
    final repository = AuthRepository(ApiClient(transport), store);

    final session = await repository.restore();

    expect(session, isNotNull);
    expect(session!.role, Role.cashier);
  });
}

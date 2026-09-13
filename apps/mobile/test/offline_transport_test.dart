import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/api/api_exception.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/mutation_queue.dart";
import "package:laundryos_mobile/src/api/offline_api_transport.dart";

import "support/fake_transport.dart";

void main() {
  test("mutasi saat offline masuk antrean dan melempar QueuedOfflineException", () async {
    final inner = FakeTransport()..enqueueError(NetworkException());
    final queue = InMemoryMutationQueue();
    final transport = OfflineApiTransport(inner, queue, () async => "tok");

    await expectLater(
      transport.post("/orders", body: {"a": 1}),
      throwsA(isA<QueuedOfflineException>()),
    );

    final pending = await queue.all();
    expect(pending, hasLength(1));
    expect(pending.single.method, "POST");
    expect(pending.single.idempotencyKey, isNotEmpty);
  });

  test("flush mengirim ulang dengan key sama lalu mengosongkan antrean", () async {
    final inner = FakeTransport()..enqueueError(NetworkException());
    final queue = InMemoryMutationQueue();
    final transport = OfflineApiTransport(inner, queue, () async => "tok");

    await transport.post("/orders", body: {"a": 1}).catchError((_) => const ApiResponse(0, null));
    final key = (await queue.all()).single.idempotencyKey;

    inner.enqueue(const ApiResponse(201, {"data": {}}));
    final synced = await transport.flush();

    expect(synced, 1);
    expect(await queue.all(), isEmpty);
    expect(inner.idempotencyKeys.last, key);
  });

  test("mutasi ditolak server dibuang dari antrean", () async {
    final inner = FakeTransport()..enqueueError(NetworkException());
    final queue = InMemoryMutationQueue();
    final transport = OfflineApiTransport(inner, queue, () async => "tok");

    await transport.post("/orders", body: {"a": 1}).catchError((_) => const ApiResponse(0, null));
    inner.enqueue(const ApiResponse(422, {"message": "Tidak valid"}));

    await transport.flush();
    expect(await queue.all(), isEmpty);
  });
}

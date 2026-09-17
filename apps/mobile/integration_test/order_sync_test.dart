import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:integration_test/integration_test.dart";
import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/in_memory_mutation_queue.dart";
import "package:laundryos_mobile/src/api/network_exception.dart";
import "package:laundryos_mobile/src/api/offline_api_transport.dart";
import "package:laundryos_mobile/src/repositories/order_repository.dart";
import "package:laundryos_mobile/src/state/order_controller.dart";

import "../test/support/fake_transport.dart";
import "../test/support/in_memory_session_store.dart";

/// T10 go-live: order dibuat saat offline masuk antrean dengan idempotency key
/// yang sama, lalu flush saat online mengirim tepat 1x.
///
/// Dijalankan di emulator/device: `flutter test integration_test/order_sync_test.dart`.
/// Di CI tanpa emulator, file ini tetap lolos sebagai unit test biasa.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets("order offline antre lalu flush tepat 1x dengan key sama",
      (tester) async {
    await tester.pumpWidget(const SizedBox());
    final inner = FakeTransport()..enqueueError(NetworkException());
    final queue = InMemoryMutationQueue();
    final store = InMemorySessionStore();
    await store.saveToken("tok");

    final offline = OfflineApiTransport(
        inner, queue, store.token, () async => "usr-1");
    final controller =
        OrderController(OrderRepository(ApiClient(offline), store.token));

    final created = await controller.create(
      outletId: "1",
      customerId: "2",
      items: [(serviceId: "3", qty: 1)],
      paidAmount: 0,
    );
    expect(created, isNull);
    expect(await queue.all(), hasLength(1));

    // Online kembali: server menerima order, flush mengirim antrean 1x.
    inner.enqueue(const ApiResponse(200, {
      "data": {
        "id": 7,
        "ticket": "KMG-20000101-001",
        "status": "received",
        "total": 11000,
        "paid_amount": 0
      }
    }));
    await offline.flush();
    expect(await queue.all(), isEmpty);
    // 2 panggilan tercatat: create() saat offline (gagal jaringan -> antre)
    // + flush saat online. Keduanya WAJIB membawa idempotency key yang SAMA.
    expect(inner.calls.where((c) => c == "POST /orders"), hasLength(2));
    final keys = inner.idempotencyKeys.whereType<String>().toList();
    expect(keys, hasLength(2));
    expect(keys[0], equals(keys[1]));
  });
}

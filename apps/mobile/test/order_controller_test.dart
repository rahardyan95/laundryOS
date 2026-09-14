import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/models/order.dart";
import "package:laundryos_mobile/src/repositories/order_repository.dart";
import "package:laundryos_mobile/src/state/order_controller.dart";

import "support/fake_transport.dart";
import "support/in_memory_session_store.dart";

void main() {
  test("OrderController.refresh lalu loadMore mengikuti paginasi", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": [
          {
            "id": 1,
            "ticket": "A-1",
            "status": "received",
            "total": 100,
            "paid_amount": 0
          },
        ],
        "meta": {"current_page": 1, "last_page": 2},
      }))
      ..enqueue(const ApiResponse(200, {
        "data": [
          {
            "id": 2,
            "ticket": "A-2",
            "status": "ready",
            "total": 200,
            "paid_amount": 200
          },
        ],
        "meta": {"current_page": 2, "last_page": 2},
      }));

    final store = InMemorySessionStore();
    await store.saveToken("tok");
    final controller =
        OrderController(OrderRepository(ApiClient(transport), store.token));

    await controller.refresh();
    expect(controller.orders, hasLength(1));
    expect(controller.hasMore, isTrue);

    await controller.loadMore();
    expect(controller.orders, hasLength(2));
    expect(controller.hasMore, isFalse);
    expect(controller.orders.last.status, OrderStatus.ready);
  });

  test("OrderController.advance mengganti item di daftar", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": [
          {
            "id": 1,
            "ticket": "A-1",
            "status": "received",
            "total": 100,
            "paid_amount": 0
          },
        ],
        "meta": {"current_page": 1, "last_page": 1},
      }))
      ..enqueue(const ApiResponse(200, {
        "data": {
          "id": 1,
          "ticket": "A-1",
          "status": "washing",
          "total": 100,
          "paid_amount": 0
        },
      }));

    final store = InMemorySessionStore();
    await store.saveToken("tok");
    final controller =
        OrderController(OrderRepository(ApiClient(transport), store.token));

    await controller.refresh();
    final ok = await controller.advance(controller.orders.first);

    expect(ok, isTrue);
    expect(controller.orders.first.status, OrderStatus.washing);
  });
}

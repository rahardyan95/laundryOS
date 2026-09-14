import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/api/api_client.dart";
import "package:laundryos_mobile/src/api/api_exception.dart";
import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/models/order.dart";

import "support/fake_transport.dart";

void main() {
  test("login mengembalikan peta respons", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "token": "tok",
        "user": {"id": 1}
      }));
    final client = ApiClient(transport);

    final body = await client.login("a@x.test", "secret", "mobile");

    expect(body["token"], "tok");
    expect(transport.calls.single, "POST /auth/login");
  });

  test("non-2xx melempar ApiException dengan message server", () async {
    final transport = FakeTransport()
      ..enqueue(
          const ApiResponse(422, {"message": "Email atau kata sandi salah."}));
    final client = ApiClient(transport);

    expect(
      () => client.login("a@x.test", "x", "mobile"),
      throwsA(
        isA<ApiException>().having((e) => e.status, "status", 422).having(
            (e) => e.message, "message", "Email atau kata sandi salah."),
      ),
    );
  });

  test("listOrders memetakan envelope dan halaman", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": [
          {
            "id": 1,
            "ticket": "A-1",
            "status": "ready",
            "total": 1000,
            "paid_amount": 1000
          },
        ],
        "meta": {"current_page": 2, "last_page": 4},
      }));
    final client = ApiClient(transport);

    final page =
        await client.listOrders("tok", page: 2, status: OrderStatus.ready);

    expect(page.orders.single.status, OrderStatus.ready);
    expect(page.currentPage, 2);
    expect(page.hasMore, isTrue);
  });

  test("advanceOrderStatus mengambil objek dari data", () async {
    final transport = FakeTransport()
      ..enqueue(const ApiResponse(200, {
        "data": {
          "id": 5,
          "ticket": "A-5",
          "status": "drying",
          "total": 0,
          "paid_amount": 0
        },
      }));
    final client = ApiClient(transport);

    final order = await client.advanceOrderStatus("tok", "5");

    expect(order.status, OrderStatus.drying);
  });
}

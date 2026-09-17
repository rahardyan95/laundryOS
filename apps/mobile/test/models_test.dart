import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/models/order.dart";
import "package:laundryos_mobile/src/models/order_page.dart";
import "package:laundryos_mobile/src/models/order_status.dart";
import "package:laundryos_mobile/src/models/role.dart";
import "package:laundryos_mobile/src/models/session.dart";

void main() {
  test("Order.fromJson memakai customer.name saat customer_name absen", () {
    final order = Order.fromJson({
      "id": 7,
      "ticket": "SBY-20260913-007",
      "status": "washing",
      "customer": {"id": 1, "name": "Budi", "phone": "0812"},
      "total": 25000,
      "paid_amount": 10000,
      "payment_status": "partial",
    });

    expect(order.id, "7");
    expect(order.status, OrderStatus.washing);
    expect(order.customerName, "Budi");
    expect(order.paidAmount, 10000);
  });

  test("OrderPage membaca envelope paginasi", () {
    final page = OrderPage.fromEnvelope({
      "data": [
        {
          "id": 1,
          "ticket": "A-1",
          "status": "received",
          "total": 0,
          "paid_amount": 0
        },
      ],
      "meta": {"current_page": 1, "last_page": 3},
    });

    expect(page.orders, hasLength(1));
    expect(page.currentPage, 1);
    expect(page.lastPage, 3);
    expect(page.hasMore, isTrue);
  });

  test("SessionPayload membaca user, tenant, dan outlets", () {
    final session = SessionPayload.fromMeJson({
      "user": {
        "id": 2,
        "name": "Ayu",
        "email": "a@x.test",
        "role": "owner",
        "outlet_id": 3
      },
      "tenant": {"id": 9},
      "outlets": [
        {"id": 3, "name": "SBY", "code": "SBY"},
      ],
    });

    expect(session.role, Role.owner);
    expect(session.email, "a@x.test");
    expect(session.tenantId, "9");
    expect(session.outletId, "3");
    expect(session.outlets.single.code, "SBY");
  });
}

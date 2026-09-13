import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/models/models.dart";

void main() {
  test("Order.fromJson memetakan field inti", () {
    final order = Order.fromJson({
      "id": 1,
      "ticket": "SBY-20260913-001",
      "status": "received",
      "customer_name": "Budi",
      "total": 10000,
      "paid_amount": 5000,
    });

    expect(order.id, "1");
    expect(order.ticket, "SBY-20260913-001");
    expect(order.customerName, "Budi");
    expect(order.total, 10000);
    expect(order.paidAmount, 5000);
  });

  test("SessionPayload.fromMeJson membaca user dan tenant", () {
    final session = SessionPayload.fromMeJson({
      "user": {"id": 2, "name": "Ayu", "role": "owner", "outlet_id": 3},
      "tenant": {"id": 9},
    });

    expect(session.userId, "2");
    expect(session.name, "Ayu");
    expect(session.role, "owner");
    expect(session.tenantId, "9");
    expect(session.outletId, "3");
  });
}

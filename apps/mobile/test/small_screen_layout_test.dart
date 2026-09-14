import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/upload_file.dart";
import "package:laundryos_mobile/src/app.dart";
import "package:laundryos_mobile/src/app_dependencies.dart";

import "support/in_memory_session_store.dart";

/// Transport tiruan yang menjawab per path, bukan per urutan, supaya uji tata
/// letak tidak bergantung pada urutan pemanggilan layar.
class _RoutingTransport implements ApiTransport {
  @override
  Future<ApiResponse> get(String path, {Map<String, String>? query, String? token}) async {
    switch (path) {
      case "/auth/me":
        return const ApiResponse(200, {
          "user": {
            "id": 1,
            "name": "Budi Santoso",
            "email": "owner@laundryos.test",
            "role": "owner",
            "outlet_id": 1,
          },
          "tenant": {"id": 1},
          "outlets": [
            {"id": 1, "name": "LaundryOS Kemang", "code": "KMG"},
          ],
        });
      case "/dashboard/summary":
        return const ApiResponse(200, {
          "data": {
            "orders_today": 128,
            "sales_today": 9876543,
            "outstanding": 1234567,
            "cash_balance": 8765432,
            "workload": [
              {"status": "washing", "count": 42},
              {"status": "ready", "count": 15},
            ],
            "ready_waiting": [
              {
                "ticket": "KMG-20260913-001234",
                "customer_name": "Putu Ayu Wulandari Kusumawardhani",
                "hours_waiting": 38,
              },
            ],
          },
        });
      case "/orders":
        return const ApiResponse(200, {
          "data": [
            {
              "id": 1,
              "ticket": "KMG-20260913-004",
              "status": "ironing",
              "customer_name": "Hendra Wijaya Kusumaatmaja",
              "total": 1234567,
              "paid_amount": 0,
              "payment_status": "unpaid",
            },
          ],
          "meta": {"current_page": 1, "last_page": 1},
        });
      case "/notifications":
        return const ApiResponse(200, {
          "data": [
            {
              "id": "n1",
              "title": "Order siap diambil",
              "body": "Order KMG-20260913-004 sudah selesai disetrika dan siap diambil pelanggan.",
              "read_at": null,
              "created_at": "2026-09-14T04:02:23+00:00",
            },
          ],
          "meta": {"current_page": 1, "last_page": 1},
        });
      case "/notifications/unread-count":
        return const ApiResponse(200, {
          "data": {"unread": 3},
        });
      default:
        return const ApiResponse(200, {
          "data": [],
          "meta": {"current_page": 1, "last_page": 1},
        });
    }
  }

  @override
  Future<ApiResponse> post(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) async =>
      const ApiResponse(200, {});

  @override
  Future<ApiResponse> patch(
    String path, {
    Object? body,
    String? token,
    String? idempotencyKey,
  }) async =>
      const ApiResponse(200, {});

  @override
  Future<ApiResponse> postMultipart(
    String path, {
    Map<String, String> fields = const {},
    Map<String, UploadFile> files = const {},
    String? token,
  }) async =>
      const ApiResponse(200, {});

  @override
  void close() {}
}

Future<void> _pumpApp(WidgetTester tester, {required Brightness brightness}) async {
  tester.view.physicalSize = const Size(375 * 3, 667 * 3);
  tester.view.devicePixelRatio = 3;
  tester.platformDispatcher.platformBrightnessTestValue = brightness;
  addTearDown(tester.view.reset);
  addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

  final store = InMemorySessionStore();
  await store.saveToken("tok");
  final dependencies = AppDependencies(transport: _RoutingTransport(), store: store);

  await tester.pumpWidget(LaundryOsApp(dependencies: dependencies));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}

void main() {
  testWidgets("layar utama tidak meluber di ponsel kecil 375x667 (terang)", (tester) async {
    await _pumpApp(tester, brightness: Brightness.light);

    expect(tester.takeException(), isNull);
    expect(find.text("Dashboard"), findsWidgets);
    expect(find.textContaining("Rp9.876.543"), findsWidgets);
  });

  testWidgets("layar utama tidak meluber di ponsel kecil 375x667 (gelap)", (tester) async {
    await _pumpApp(tester, brightness: Brightness.dark);

    expect(tester.takeException(), isNull);
    expect(find.text("Dashboard"), findsWidgets);
    expect(find.textContaining("Rp9.876.543"), findsWidgets);
  });

  testWidgets("tab Order menampilkan data tanpa meluber", (tester) async {
    await _pumpApp(tester, brightness: Brightness.light);

    await tester.tap(find.text("Order").last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(tester.takeException(), isNull);
    expect(find.textContaining("KMG-20260913-004"), findsWidgets);
    expect(find.text("Ke Siap Diambil"), findsOneWidget);
  });

  testWidgets("tab Notifikasi menampilkan lencana baru tanpa meluber", (tester) async {
    await _pumpApp(tester, brightness: Brightness.light);

    await tester.tap(find.text("Notifikasi").last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(tester.takeException(), isNull);
    expect(find.text("Baru"), findsOneWidget);
  });
}

import "package:flutter/material.dart";
import "package:flutter/services.dart" show FontLoader, rootBundle;
import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/api/api_transport.dart";
import "package:laundryos_mobile/src/api/upload_file.dart";
import "package:laundryos_mobile/src/app.dart";
import "package:laundryos_mobile/src/app_dependencies.dart";
import "package:laundryos_mobile/src/domain/status_kind.dart";
import "package:laundryos_mobile/src/theme/app_metrics.dart";
import "package:laundryos_mobile/src/theme/app_theme.dart";
import "package:laundryos_mobile/src/theme/app_typography.dart";
import "package:laundryos_mobile/src/widgets/section_header.dart";
import "package:laundryos_mobile/src/widgets/stat_tile.dart";
import "package:laundryos_mobile/src/widgets/status_chip.dart";

import "support/in_memory_session_store.dart";

/// Transport deterministik untuk golden: data tetap, tanpa jaringan.
class _GoldenTransport implements ApiTransport {
  @override
  Future<ApiResponse> get(String path,
      {Map<String, String>? query, String? token}) async {
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
                "customer_name": "Putu Ayu",
                "hours_waiting": 38
              },
            ],
          },
        });
      default:
        return const ApiResponse(200, {
          "data": [],
          "meta": {"current_page": 1, "last_page": 1},
        });
    }
  }

  @override
  Future<ApiResponse> post(String path,
          {Object? body, String? token, String? idempotencyKey}) async =>
      const ApiResponse(200, {});

  @override
  Future<ApiResponse> patch(String path,
          {Object? body, String? token, String? idempotencyKey}) async =>
      const ApiResponse(200, {});

  @override
  Future<ApiResponse> delete(String path,
          {Object? body, String? token}) async =>
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

/// Memuat font asli supaya golden menunjukkan teks yang sesungguhnya, bukan
/// kotak fallback. Berkas font ikut repo, jadi hasilnya sama antar mesin dengan
/// versi Flutter yang sama.
Future<void> _loadAppFonts() async {
  final loader = FontLoader(AppTypography.family)
    ..addFont(rootBundle.load("assets/fonts/PlusJakartaSans-Variable.ttf"));
  await loader.load();
}

ThemeData _theme(Brightness brightness) =>
    brightness == Brightness.dark ? AppTheme.dark() : AppTheme.light();

/// Komposisi tetap: lencana status + dua kartu angka. Sengaja tanpa riak,
/// tanpa bayangan bergerak — hanya bentuk dan warna.
Widget _statusSurface() => const SingleChildScrollView(
      padding: AppSpacing.screen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          SectionHeader(title: "Lencana status"),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              StatusChip(label: "Diterima", kind: StatusKind.neutral),
              StatusChip(label: "Dicuci", kind: StatusKind.info),
              StatusChip(label: "Disetrika", kind: StatusKind.warning),
              StatusChip(label: "Siap Diambil", kind: StatusKind.brand),
              StatusChip(label: "Selesai", kind: StatusKind.positive),
              StatusChip(label: "Dibatalkan", kind: StatusKind.negative),
              StatusChip(
                  label: "Belum Bayar",
                  kind: StatusKind.warning,
                  outlined: true),
            ],
          ),
          SizedBox(height: AppSpacing.lg),
          SectionHeader(title: "Ringkasan hari ini"),
          Row(
            children: [
              Expanded(
                child:
                    StatTile(label: "Penjualan hari ini", value: "Rp9.876.543"),
              ),
              SizedBox(width: AppSpacing.md),
              Expanded(
                child: StatTile(label: "Belum dibayar", value: "Rp1.234.567"),
              ),
            ],
          ),
        ],
      ),
    );

void _useSurface(WidgetTester tester, Size logical, {double pixelRatio = 2}) {
  tester.view.physicalSize = logical * pixelRatio;
  tester.view.devicePixelRatio = pixelRatio;
  addTearDown(tester.view.reset);
}

Future<void> _pumpStatusSurface(
    WidgetTester tester, Brightness brightness) async {
  _useSurface(tester, const Size(360, 300));
  await tester.pumpWidget(MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: _theme(brightness),
    home: Scaffold(body: _statusSurface()),
  ));
  await tester.pump();
}

Future<void> _pumpDashboard(WidgetTester tester, Brightness brightness) async {
  _useSurface(tester, const Size(375, 667));
  tester.platformDispatcher.platformBrightnessTestValue = brightness;
  addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

  final store = InMemorySessionStore();
  await store.saveToken("tok");
  final dependencies =
      AppDependencies(transport: _GoldenTransport(), store: store);

  await tester.pumpWidget(LaundryOsApp(dependencies: dependencies));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}

void main() {
  setUpAll(_loadAppFonts);

  testWidgets("lencana status dan kartu angka (terang)", (tester) async {
    await _pumpStatusSurface(tester, Brightness.light);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile("goldens/status_surface.light.png"),
    );
  });

  testWidgets("lencana status dan kartu angka (gelap)", (tester) async {
    await _pumpStatusSurface(tester, Brightness.dark);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile("goldens/status_surface.dark.png"),
    );
  });

  testWidgets("layar dashboard 375x667 (terang)", (tester) async {
    await _pumpDashboard(tester, Brightness.light);
    await expectLater(
      find.byType(LaundryOsApp),
      matchesGoldenFile("goldens/dashboard.light.png"),
    );
  });

  testWidgets("layar dashboard 375x667 (gelap)", (tester) async {
    await _pumpDashboard(tester, Brightness.dark);
    await expectLater(
      find.byType(LaundryOsApp),
      matchesGoldenFile("goldens/dashboard.dark.png"),
    );
  });
}

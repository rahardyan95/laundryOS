import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/theme/app_theme.dart";
import "package:laundryos_mobile/src/widgets/async_section.dart";

Widget _wrap(Widget child) => MaterialApp(
      theme: AppTheme.light(),
      home: Scaffold(body: child),
    );

void main() {
  testWidgets("saat memuat dan belum ada isi, tampilkan indikator", (tester) async {
    await tester.pumpWidget(
      _wrap(
        const AsyncSection(
          isLoading: true,
          isEmpty: true,
          empty: Text("kosong"),
          child: Text("isi"),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text("kosong"), findsNothing);
    expect(find.text("isi"), findsNothing);
  });

  testWidgets("saat selesai tanpa data, tampilkan keadaan kosong", (tester) async {
    await tester.pumpWidget(
      _wrap(
        const AsyncSection(
          isLoading: false,
          isEmpty: true,
          empty: Text("kosong"),
          child: Text("isi"),
        ),
      ),
    );

    expect(find.text("kosong"), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsNothing);
  });

  testWidgets("saat ada data, tampilkan isi", (tester) async {
    await tester.pumpWidget(
      _wrap(
        const AsyncSection(
          isLoading: false,
          isEmpty: false,
          empty: Text("kosong"),
          child: Text("isi"),
        ),
      ),
    );

    expect(find.text("isi"), findsOneWidget);
    expect(find.text("kosong"), findsNothing);
  });

  testWidgets("galat tetap terlihat walau ada data lama", (tester) async {
    var retried = false;

    await tester.pumpWidget(
      _wrap(
        AsyncSection(
          isLoading: false,
          isEmpty: false,
          errorMessage: "Gagal memuat.",
          onRetry: () => retried = true,
          empty: const Text("kosong"),
          child: const Text("isi"),
        ),
      ),
    );

    expect(find.text("Gagal memuat."), findsOneWidget);
    expect(find.text("isi"), findsOneWidget);

    await tester.tap(find.text("Coba lagi"));
    expect(retried, isTrue);
  });

  testWidgets("memuat halaman berikutnya memakai indikator ringkas", (tester) async {
    await tester.pumpWidget(
      _wrap(
        const AsyncSection(
          isLoading: false,
          isLoadingMore: true,
          isEmpty: false,
          empty: Text("kosong"),
          child: Text("isi"),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text("isi"), findsOneWidget);
  });
}

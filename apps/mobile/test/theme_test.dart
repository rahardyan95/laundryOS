import "dart:math" as math;

import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/domain/status_kind.dart";
import "package:laundryos_mobile/src/theme/app_status_tones.dart";
import "package:laundryos_mobile/src/theme/app_theme.dart";
import "package:laundryos_mobile/src/widgets/status_chip.dart";

/// Kontras WCAG 2.1: (L1 + 0.05) / (L2 + 0.05) dengan luminansi relatif.
double _channel(double value) =>
    value <= 0.03928 ? value / 12.92 : math.pow((value + 0.055) / 1.055, 2.4).toDouble();

double _luminance(Color color) =>
    0.2126 * _channel(color.r) + 0.7152 * _channel(color.g) + 0.0722 * _channel(color.b);

double contrastRatio(Color a, Color b) {
  final la = _luminance(a);
  final lb = _luminance(b);
  final hi = math.max(la, lb);
  final lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  group("kontras tone status", () {
    final sets = {"terang": StatusTones.light, "gelap": StatusTones.dark};

    for (final entry in sets.entries) {
      for (final kind in StatusKind.values) {
        test("${entry.key}: ${kind.name} minimal 4.5:1", () {
          final tone = entry.value.tone(kind);
          expect(
            contrastRatio(tone.foreground, tone.background),
            greaterThanOrEqualTo(4.5),
            reason: "teks status harus terbaca di latarnya",
          );
        });
      }
    }
  });

  group("kontras tema", () {
    test("teks utama dan sekunder lolos 4.5:1 di kedua mode", () {
      for (final theme in [AppTheme.light(), AppTheme.dark()]) {
        final scheme = theme.colorScheme;
        final pairs = {
          "onSurface/surface": (scheme.onSurface, scheme.surface),
          "onSurfaceVariant/surface": (scheme.onSurfaceVariant, scheme.surface),
          "onPrimary/primary": (scheme.onPrimary, scheme.primary),
          "onPrimaryContainer/primaryContainer": (
            scheme.onPrimaryContainer,
            scheme.primaryContainer,
          ),
          "onError/error": (scheme.onError, scheme.error),
          "onErrorContainer/errorContainer": (scheme.onErrorContainer, scheme.errorContainer),
        };
        for (final pair in pairs.entries) {
          expect(
            contrastRatio(pair.value.$1, pair.value.$2),
            greaterThanOrEqualTo(4.5),
            reason: "${pair.key} gagal di mode ${scheme.brightness.name}",
          );
        }
      }
    });
  });

  group("perakitan tema", () {
    test("memasang ekstensi StatusTones sesuai mode", () {
      final light = AppTheme.light();
      final dark = AppTheme.dark();

      expect(light.brightness, Brightness.light);
      expect(dark.brightness, Brightness.dark);
      expect(light.extension<StatusTones>(), StatusTones.light);
      expect(dark.extension<StatusTones>(), StatusTones.dark);
    });

    test("tipografi memakai keluarga Plus Jakarta Sans", () {
      final theme = AppTheme.light();
      expect(theme.textTheme.bodyLarge?.fontFamily, "PlusJakartaSans");
      expect(theme.textTheme.displaySmall?.fontFamily, "PlusJakartaSans");
      expect(theme.textTheme.displaySmall?.fontFeatures, contains(const FontFeature.tabularFigures()));
    });

    test("sasaran sentuh tombol minimal 48dp", () {
      final style = AppTheme.light().filledButtonTheme.style;
      final size = style?.minimumSize?.resolve({});
      expect(size?.height, greaterThanOrEqualTo(48));
    });
  });

  group("StatusChip", () {
    testWidgets("memakai warna tone dari tema, bukan warna bawaan", (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: StatusChip(label: "Siap Diambil", kind: StatusKind.brand),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration! as BoxDecoration;

      expect(decoration.color, StatusTones.light.brand.background);
      expect(find.text("Siap Diambil"), findsOneWidget);
    });

    testWidgets("versi garis tepi tidak memakai latar", (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          home: const Scaffold(
            body: StatusChip(label: "Belum Bayar", kind: StatusKind.negative, outlined: true),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration! as BoxDecoration;

      expect(decoration.color, isNull);
      expect(decoration.border, isNotNull);
    });
  });
}

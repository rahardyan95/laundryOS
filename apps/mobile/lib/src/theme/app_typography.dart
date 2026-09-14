import "package:flutter/material.dart";

/// Skala tipografi aplikasi.
///
/// Satu keluarga untuk semua peran (Plus Jakarta Sans, sama dengan web):
/// keluarga kedua akan menambah gaya tanpa menambah keterbacaan. Rentangnya
/// sengaja pendek, 12-28, karena layar operasional hanya butuh enam tingkat.
///
/// Motif identitas: semua angka nominal dan kuantitas memakai *tabular figures*
/// supaya kolom rupiah tidak bergoyang saat nilainya berubah.
class AppTypography {
  const AppTypography._();

  static const String family = "PlusJakartaSans";

  /// Angka lebar tetap, dipakai untuk rupiah, kuantitas, jam, dan nomor tiket.
  static const List<FontFeature> tabular = [FontFeature.tabularFigures()];

  static TextTheme textTheme(Color ink, Color muted) {
    return TextTheme(
      displaySmall: TextStyle(
        fontFamily: family,
        fontSize: 28,
        height: 1.15,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.6,
        color: ink,
        fontFeatures: tabular,
      ),
      headlineSmall: TextStyle(
        fontFamily: family,
        fontSize: 22,
        height: 1.2,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: ink,
      ),
      titleLarge: TextStyle(
        fontFamily: family,
        fontSize: 18,
        height: 1.25,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.2,
        color: ink,
      ),
      titleMedium: TextStyle(
        fontFamily: family,
        fontSize: 15,
        height: 1.3,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      bodyLarge: TextStyle(
        fontFamily: family,
        fontSize: 16,
        height: 1.5,
        fontWeight: FontWeight.w400,
        color: ink,
      ),
      bodyMedium: TextStyle(
        fontFamily: family,
        fontSize: 14,
        height: 1.45,
        fontWeight: FontWeight.w400,
        color: ink,
      ),
      bodySmall: TextStyle(
        fontFamily: family,
        fontSize: 13,
        height: 1.4,
        fontWeight: FontWeight.w400,
        color: muted,
      ),
      labelLarge: TextStyle(
        fontFamily: family,
        fontSize: 15,
        height: 1.2,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      labelMedium: TextStyle(
        fontFamily: family,
        fontSize: 12,
        height: 1.2,
        fontWeight: FontWeight.w600,
        color: ink,
      ),
      labelSmall: TextStyle(
        fontFamily: family,
        fontSize: 12,
        height: 1.2,
        fontWeight: FontWeight.w500,
        color: muted,
      ),
    );
  }

  /// Gaya untuk angka nominal: ukuran judul, angka tabular.
  static TextStyle amount(BuildContext context, {Color? color}) {
    final base = Theme.of(context).textTheme.titleLarge ?? const TextStyle();
    return base.copyWith(fontFeatures: tabular, color: color ?? base.color);
  }

  /// Gaya untuk kode tiket dan angka kecil yang harus sejajar antar baris.
  static TextStyle mono(BuildContext context, {Color? color}) {
    final base = Theme.of(context).textTheme.labelLarge ?? const TextStyle();
    return base.copyWith(
        fontFeatures: tabular, letterSpacing: 0.2, color: color ?? base.color);
  }
}

import "package:flutter/material.dart";

/// Token warna mentah LaundryOS, turunan `apps/web/DESIGN.md` §1 ("Pine & Lime").
///
/// Setiap token punya alasan satu baris (antislop R-31). Pasangan teks/latar
/// yang dipakai di UI diperiksa rasio kontrasnya di `test/theme_test.dart`
/// (R-25: minimal 4.5:1 untuk teks normal).
class AppPalette {
  const AppPalette._();

  // --- Merek ---
  /// Hijau pinus: air bersih dan dedaunan. Sengaja bukan biru SaaS generik.
  static const Color pine = Color(0xFF0C3B36);

  /// Limau: satu momen aksen saja (indikator tab aktif, penanda "siap diambil").
  /// Tidak pernah untuk teks body karena kontrasnya rendah di atas kertas.
  static const Color lime = Color(0xFFBEF264);

  // --- Permukaan, mode terang ---
  /// Kertas: putih hangat, bukan putih biru, supaya terasa seperti linen bersih.
  static const Color paper = Color(0xFFF7F6F1);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  /// Kelabu-pinus: isian input dan permukaan sekunder agar kartu putih tetap menonjol.
  static const Color pineGrey = Color(0xFFEDF2EF);
  static const Color outlineLight = Color(0xFFD8E1DC);

  // --- Teks, mode terang (kontras terukur di theme_test.dart) ---
  /// Tinta: hampir-hitam hangat, 14.9:1 di atas kertas.
  static const Color ink = Color(0xFF152420);

  /// Teks sekunder: 6.6:1 di atas kertas, tetap lolos ambang 4.5:1.
  static const Color muted = Color(0xFF4E5B56);
  static const Color onPine = Color(0xFFFFFFFF);
  static const Color pineSoft = Color(0xFFDCEAE3);
  static const Color onPineSoft = Color(0xFF0A2F2B);
  static const Color onLime = Color(0xFF1B2E12);

  // --- Permukaan, mode gelap ---
  /// Malam: hitam kehijauan, bukan hitam pekat, supaya tetap satu keluarga dengan pinus.
  static const Color night = Color(0xFF0F1614);
  static const Color nightSurface = Color(0xFF161F1C);
  static const Color nightSurfaceAlt = Color(0xFF1D2724);
  static const Color outlineDark = Color(0xFF2C3936);

  // --- Teks, mode gelap ---
  static const Color inkDark = Color(0xFFE7EDEA);
  static const Color mutedDark = Color(0xFFA8B5B0);

  /// Pinus dicerahkan agar tetap berfungsi sebagai warna teks di latar gelap.
  static const Color pineBright = Color(0xFF9ED6C4);
  static const Color onPineBright = Color(0xFF06251F);
  static const Color pineSoftDark = Color(0xFF1E3A34);
  static const Color onPineSoftDark = Color(0xFFCFE9E0);
  static const Color limeBright = Color(0xFFC7F07A);

  // --- Galat ---
  static const Color error = Color(0xFFB3261E);
  static const Color errorContainer = Color(0xFFFEE2E2);
  static const Color onErrorContainer = Color(0xFF7F1D1D);
  static const Color errorDark = Color(0xFFFCA5A5);
  static const Color errorContainerDark = Color(0xFF3A1717);
  static const Color onErrorContainerDark = Color(0xFFFAD4D4);
}

import "package:flutter/material.dart";

/// Token jarak, radius, dan durasi.
///
/// Alasannya satu: aplikasi ini dipakai sambil berdiri dan satu tangan, jadi
/// semua ukuran mengikuti satu tangga 4dp/8dp supaya mata tidak perlu
/// menyesuaikan diri antar layar (pro-rules "8dp spacing rhythm").
class AppSpacing {
  const AppSpacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 32;

  /// Jarak tepi standar layar. Bawah lebih lega karena ada NavigationBar.
  static const EdgeInsets screen = EdgeInsets.fromLTRB(lg, sm, lg, xxl);

  /// Jarak di dalam kartu.
  static const EdgeInsets card = EdgeInsets.all(lg);

  /// Jarak antar kartu pada daftar.
  static const double listGap = md;
}

/// Radius dipakai untuk menunjukkan tingkat: kontrol < kartu < lembaran.
/// Semuanya kecil dan berbeda-beda supaya tidak ada kesan "semua pil"
/// (antislop R-11).
class AppRadii {
  const AppRadii._();

  static const double chip = 10;
  static const double field = 12;
  static const double card = 16;
  static const double sheet = 24;

  static const BorderRadius chipBorder =
      BorderRadius.all(Radius.circular(chip));
  static const BorderRadius fieldBorder =
      BorderRadius.all(Radius.circular(field));
  static const BorderRadius cardBorder =
      BorderRadius.all(Radius.circular(card));
}

/// Durasi gerak. Aplikasi ini memakai MOTION 1: hanya umpan balik sentuhan,
/// tanpa animasi masuk, tanpa loop. Alasannya: petugas butuh layar yang terasa
/// seketika di perangkat murah, dan gerak hiasan hanya menambah beban GPU.
class AppMotion {
  const AppMotion._();

  /// Umpan balik tekan.
  static const Duration press = Duration(milliseconds: 120);

  /// Perubahan status halus seperti ganti warna indikator.
  static const Duration state = Duration(milliseconds: 180);
}

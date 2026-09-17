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

  /// Isi lencana status: padat, bukan sasaran sentuh.
  static const EdgeInsets chip =
      EdgeInsets.symmetric(horizontal: 10, vertical: 5);

  /// Isi pita konektivitas.
  static const EdgeInsets banner =
      EdgeInsets.symmetric(horizontal: md, vertical: 6);

  /// Selisih label kecil di bawah judul seksi.
  static const double labelGap = 2;
}

/// Ukuran ikon dan avatar. Ikon mengikuti tangga 2dp agar selaras dengan
/// ketebalan garis dan radius (R1.4).
class AppIconSizes {
  const AppIconSizes._();

  static const double xs = 16;
  static const double sm = 18;
  static const double md = 20;
  static const double lg = 40;
}

/// Ukuran avatar lingkaran (mis. ikon notifikasi).
class AppAvatarSizes {
  const AppAvatarSizes._();

  static const double notification = 36;
}

/// Ukuran marka merek.
class AppBrandSizes {
  const AppBrandSizes._();

  /// Marka pada lockup layar masuk.
  static const double lockupMark = 56;
}

/// Ukuran indikator loading kecil di dalam tombol.
class AppLoaderSizes {
  const AppLoaderSizes._();

  static const double button = 18;
  static const double stroke = 2;

  /// Indikator blok memuat layar.
  static const double block = 28;
  static const double strokeWide = 2.5;
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

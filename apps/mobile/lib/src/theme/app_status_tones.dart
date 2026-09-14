import "package:flutter/material.dart";

import "../domain/status_kind.dart";
import "app_palette.dart";

/// Sepasang warna untuk satu status: [foreground] untuk teks dan ikon,
/// [background] untuk latarnya. Keduanya selalu dipakai bersama supaya
/// kontrasnya terjaga (tiap pasangan diverifikasi di `test/theme_test.dart`).
class StatusTone {
  const StatusTone(this.foreground, this.background);

  final Color foreground;
  final Color background;
}

/// Peta [StatusKind] ke warnanya, dibawa sebagai `ThemeExtension` supaya
/// widget cukup meminta tone dari tema, bukan menyalin kode warna.
class StatusTones extends ThemeExtension<StatusTones> {
  const StatusTones({
    required this.neutral,
    required this.info,
    required this.warning,
    required this.attention,
    required this.positive,
    required this.negative,
    required this.brand,
  });

  final StatusTone neutral;
  final StatusTone info;
  final StatusTone warning;
  final StatusTone attention;
  final StatusTone positive;
  final StatusTone negative;
  final StatusTone brand;

  /// Mengambil tone dari tema. Jatuh ke mode terang bila tema belum memasang
  /// ekstensi ini (mis. `MaterialApp` polos di widget test), supaya uji yang
  /// tidak menyentuh warna tidak ikut gagal.
  static StatusTones of(BuildContext context) =>
      Theme.of(context).extension<StatusTones>() ?? light;

  StatusTone tone(StatusKind kind) => switch (kind) {
        StatusKind.neutral => neutral,
        StatusKind.info => info,
        StatusKind.warning => warning,
        StatusKind.attention => attention,
        StatusKind.positive => positive,
        StatusKind.negative => negative,
        StatusKind.brand => brand,
      };

  /// Mode terang, diselaraskan dengan semantik status di DESIGN.md §5.
  static const StatusTones light = StatusTones(
    neutral: StatusTone(Color(0xFF57534E), Color(0xFFEFEDEA)),
    info: StatusTone(Color(0xFF075985), Color(0xFFE0F2FE)),
    warning: StatusTone(Color(0xFF92400E), Color(0xFFFEF3C7)),
    attention: StatusTone(Color(0xFF6B21A8), Color(0xFFF3E8FF)),
    positive: StatusTone(Color(0xFF065F46), Color(0xFFD1FAE5)),
    negative: StatusTone(Color(0xFFB91C1C), Color(0xFFFEE2E2)),
    brand: StatusTone(AppPalette.onPine, AppPalette.pine),
  );

  /// Mode gelap: peran warna sama, tetapi teksnya dicerahkan agar tetap lolos
  /// kontras 4.5:1 di atas permukaan gelap.
  static const StatusTones dark = StatusTones(
    neutral: StatusTone(Color(0xFFD6D3D1), Color(0xFF2A2926)),
    info: StatusTone(Color(0xFF7DD3FC), Color(0xFF0C2A3A)),
    warning: StatusTone(Color(0xFFFCD34D), Color(0xFF33260A)),
    attention: StatusTone(Color(0xFFD8B4FE), Color(0xFF2B1B3D)),
    positive: StatusTone(Color(0xFF6EE7B7), Color(0xFF0C2E24)),
    negative: StatusTone(Color(0xFFFCA5A5), Color(0xFF3A1717)),
    brand: StatusTone(AppPalette.onPineBright, AppPalette.pineBright),
  );

  @override
  StatusTones copyWith({
    StatusTone? neutral,
    StatusTone? info,
    StatusTone? warning,
    StatusTone? attention,
    StatusTone? positive,
    StatusTone? negative,
    StatusTone? brand,
  }) {
    return StatusTones(
      neutral: neutral ?? this.neutral,
      info: info ?? this.info,
      warning: warning ?? this.warning,
      attention: attention ?? this.attention,
      positive: positive ?? this.positive,
      negative: negative ?? this.negative,
      brand: brand ?? this.brand,
    );
  }

  /// Tone tidak dianimasikan: pada `t >= 0.5` tema tujuan sudah dipakai penuh.
  @override
  StatusTones lerp(ThemeExtension<StatusTones>? other, double t) {
    if (other is! StatusTones) return this;
    return t < 0.5 ? this : other;
  }
}

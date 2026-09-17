import "package:flutter/material.dart";

import "../theme/app_palette.dart";

/// Marka merek LaundryOS: ubin squircle dengan tetesan air dan potongan ombak.
///
/// Digambar sebagai vektor (`CustomPainter`) agar tajam di semua kepadatan
/// layar dan ikut warna tema. Geometrinya sama dengan `LogoMark` di web
/// (`apps/web/src/components/layout/logo.tsx`), jadi satu identitas dipakai di
/// dua platform. Bukan ilustrasi generik dan bukan ikon pustaka (R-04, R-22).
///
/// Angka geometri di `_MarkPainter` adalah koordinat ruang vektor 32-unit
/// milik karya seni ini, bukan jarak UI — jadi tidak memakai `AppSpacing`.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 44, this.onDark = false});

  final double size;

  /// Di atas latar gelap, warna dibalik: ubin limau, tetes pinus.
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _MarkPainter(
          tile: onDark ? AppPalette.lime : AppPalette.pine,
          drop: onDark ? AppPalette.pine : AppPalette.lime,
          wave: onDark ? AppPalette.lime : AppPalette.pine,
        ),
      ),
    );
  }
}

class _MarkPainter extends CustomPainter {
  const _MarkPainter(
      {required this.tile, required this.drop, required this.wave});

  final Color tile;
  final Color drop;
  final Color wave;

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 32;
    canvas.save();
    canvas.scale(scale);

    final tilePaint = Paint()..color = tile;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
          const Rect.fromLTWH(1, 1, 30, 30), const Radius.circular(9)),
      tilePaint,
    );

    canvas.drawPath(_dropletPath(), Paint()..color = drop);

    canvas.drawPath(
      _wavePath(),
      Paint()
        ..color = wave
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round,
    );

    canvas.restore();
  }

  /// Tetes air: dua kurva kubik dari puncak, lingkaran bawah, lalu kembali.
  Path _dropletPath() {
    const center = Offset(16, 17.5);
    const radius = 6.8;

    return Path()
      ..moveTo(16, 5.5)
      ..cubicTo(19.4, 9.9, 22.8, 13.8, 22.8, 17.5)
      ..addArc(
        Rect.fromCircle(center: center, radius: radius),
        0,
        3.141592653589793,
      )
      ..cubicTo(9.2, 13.8, 12.6, 9.9, 16, 5.5)
      ..close();
  }

  /// Ombak: dua kuadrat bersambung, menandai gerak air.
  Path _wavePath() {
    return Path()
      ..moveTo(10.6, 19.4)
      ..quadraticBezierTo(13.3, 17.4, 16, 19.4)
      ..quadraticBezierTo(18.7, 21.4, 21.4, 19.4);
  }

  @override
  bool shouldRepaint(_MarkPainter oldDelegate) =>
      oldDelegate.tile != tile ||
      oldDelegate.drop != drop ||
      oldDelegate.wave != wave;
}

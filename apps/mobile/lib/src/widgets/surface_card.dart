import "package:flutter/material.dart";

import "../theme/app_metrics.dart";

/// Permukaan kartu aplikasi: latar terang, garis tepi halus, sudut 16.
///
/// Dipakai untuk setiap kelompok informasi supaya daftar panjang tetap
/// terpisah tanpa bayangan yang membuat semua elemen terlihat melayang.
/// Bila [onTap] diisi, seluruh kartu menjadi satu sasaran sentuh dengan
/// riak sebagai umpan balik.
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = AppSpacing.card,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Card(
      child: Padding(padding: padding, child: child),
    );

    if (onTap == null) return card;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

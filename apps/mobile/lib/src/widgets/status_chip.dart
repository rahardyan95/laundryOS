import "package:flutter/material.dart";

import "../domain/status_kind.dart";
import "../theme/app_metrics.dart";
import "../theme/app_status_tones.dart";

/// Lencana status: satu label, satu makna, satu warna.
///
/// Memakai `Container` sendiri, bukan `Chip` bawaan, supaya kepadatan dan
/// kontrasnya ditentukan tema aplikasi, bukan default Material. Lencana tidak
/// interaktif, jadi tidak perlu sasaran sentuh 48dp.
class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    required this.kind,
    this.outlined = false,
  });

  final String label;
  final StatusKind kind;

  /// Garis tepi tanpa latar. Dipakai "Belum Bayar": status yang perlu terbaca
  /// sebagai peringatan tanpa mengklaim sudah lunas.
  final bool outlined;

  @override
  Widget build(BuildContext context) {
    final tone = StatusTones.of(context).tone(kind);
    final textStyle = Theme.of(context)
        .textTheme
        .labelMedium
        ?.copyWith(color: tone.foreground);

    return Container(
      padding: AppSpacing.chip,
      decoration: BoxDecoration(
        color: outlined ? null : tone.background,
        borderRadius: AppRadii.chipBorder,
        border: outlined
            ? Border.all(color: tone.foreground.withValues(alpha: 0.55))
            : null,
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: textStyle,
      ),
    );
  }
}

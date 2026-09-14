import "package:flutter/material.dart";

import "../theme/app_metrics.dart";
import "../theme/app_typography.dart";
import "surface_card.dart";

/// Satu jawaban ringkas: label kecil di atas, angka besar di bawah.
///
/// Dipakai berpasangan dua kolom di dashboard. [isAmount] menentukan angka
/// ditampilkan dengan figur tabular, sehingga kolom rupiah tetap sejajar
/// antar kartu.
class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.label,
    required this.value,
    this.isAmount = true,
  });

  final String label;
  final String value;
  final bool isAmount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final valueStyle = isAmount
        ? AppTypography.amount(context, color: theme.colorScheme.onSurface)
        : theme.textTheme.headlineSmall;

    return SurfaceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: theme.textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: AppSpacing.xs),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, maxLines: 1, style: valueStyle),
          ),
        ],
      ),
    );
  }
}

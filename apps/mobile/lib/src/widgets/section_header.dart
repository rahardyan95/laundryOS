import "package:flutter/material.dart";

import "../theme/app_metrics.dart";

/// Judul bagian di dalam layar: huruf kecil, bobot sedang, tanpa huruf kapital
/// semua (huruf kapital berspasi lebar sulit dibaca dan terasa seperti teriakan).
class SectionHeader extends StatelessWidget {
  const SectionHeader(
      {super.key, required this.title, this.trailing, this.caption});

  final String title;
  final String? caption;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleMedium),
                if (caption != null) ...[
                  const SizedBox(height: AppSpacing.labelGap),
                  Text(caption!, style: theme.textTheme.bodySmall),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

import "package:flutter/material.dart";

import "../theme/app_metrics.dart";

/// Keadaan kosong yang menjelaskan sebab dan langkah berikutnya.
///
/// Teks "tidak ada data" saja memaksa pengguna menebak, jadi [hint] wajib
/// menyebut kenapa kosong dan [action] menyebut apa yang bisa dilakukan
/// (antislop R-27).
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.message,
    required this.hint,
    this.icon = Icons.inbox_outlined,
    this.action,
  });

  final String message;
  final String hint;
  final IconData icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(
          vertical: AppSpacing.xxl, horizontal: AppSpacing.lg),
      child: Column(
        children: [
          Icon(icon,
              size: AppIconSizes.lg,
              color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: AppSpacing.md),
          Text(message,
              style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
          const SizedBox(height: AppSpacing.xs),
          Text(hint,
              style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
          if (action != null) ...[
            const SizedBox(height: AppSpacing.lg),
            action!,
          ],
        ],
      ),
    );
  }
}

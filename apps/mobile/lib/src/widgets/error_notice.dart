import "package:flutter/material.dart";

import "../theme/app_metrics.dart";
import "../theme/app_status_tones.dart";
import "../domain/status_kind.dart";

/// Pesan galat yang menyebut apa yang gagal dan menawarkan satu tindakan.
///
/// Warnanya diambil dari tone `negative`, jadi galat tampil sama di seluruh
/// aplikasi dan tidak pernah bergantung pada warna bawaan Material.
class ErrorNotice extends StatelessWidget {
  const ErrorNotice(
      {super.key,
      required this.message,
      this.onRetry,
      this.retryLabel = "Coba lagi"});

  final String message;
  final VoidCallback? onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tone = StatusTones.of(context).tone(StatusKind.negative);

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: tone.background,
        borderRadius: AppRadii.fieldBorder,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 20, color: tone.foreground),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style:
                  theme.textTheme.bodyMedium?.copyWith(color: tone.foreground),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(width: AppSpacing.sm),
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(foregroundColor: tone.foreground),
              child: Text(retryLabel),
            ),
          ],
        ],
      ),
    );
  }
}

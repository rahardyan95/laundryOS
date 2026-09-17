import "package:flutter/material.dart";

import "../theme/app_metrics.dart";
import "brand_mark.dart";

/// Marka plus nama produk. Dipakai di layar masuk sebagai fokus tunggal layar.
class BrandLockup extends StatelessWidget {
  const BrandLockup({super.key, this.markSize = 48, this.subtitle});

  final double markSize;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        const BrandMark(size: AppBrandSizes.lockupMark),
        const SizedBox(height: AppSpacing.md),
        Text("LaundryOS", style: theme.textTheme.headlineSmall),
        if (subtitle != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(subtitle!,
              style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
        ],
      ],
    );
  }
}

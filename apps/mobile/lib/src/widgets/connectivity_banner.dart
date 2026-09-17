import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/sync_message.dart";
import "../state/connectivity_controller.dart";
import "../state/sync_controller.dart";
import "../theme/app_metrics.dart";

/// Pita status sinkronisasi di atas isi layar.
///
/// Hanya muncul saat ada yang perlu diketahui: sedang offline, sedang
/// menyinkronkan, atau ada perubahan yang belum terkirim. Pita yang selalu
/// tampil akan menjadi hiasan.
class ConnectivityBanner extends StatelessWidget {
  const ConnectivityBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final offline = context.select<ConnectivityController, bool>(
      (connectivity) => !connectivity.isOnline,
    );
    final sync = context.watch<SyncController>();

    final message = SyncMessage.messageFor(
      offline: offline,
      pending: sync.pending,
      syncing: sync.syncing,
    );
    if (message == null) return const SizedBox.shrink();

    final scheme = Theme.of(context).colorScheme;
    final background =
        offline ? scheme.errorContainer : scheme.secondaryContainer;
    final foreground =
        offline ? scheme.onErrorContainer : scheme.onSecondaryContainer;

    return Material(
      color: background,
      child: SafeArea(
        top: false,
        bottom: false,
        child: Padding(
          padding: AppSpacing.banner,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(offline ? Icons.cloud_off_outlined : Icons.sync,
                  size: AppIconSizes.xs, color: foreground),
              const SizedBox(width: AppSpacing.sm),
              Flexible(
                child: Text(
                  message,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: foreground),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

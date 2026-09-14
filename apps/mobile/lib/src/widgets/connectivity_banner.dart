import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../state/connectivity_controller.dart";
import "../state/sync_controller.dart";

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

    final message = _messageFor(offline, sync.pending, sync.syncing);
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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(offline ? Icons.cloud_off_outlined : Icons.sync,
                  size: 16, color: foreground),
              const SizedBox(width: 8),
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

  String? _messageFor(bool offline, int pending, bool syncing) {
    if (offline) {
      return pending > 0
          ? "Mode offline, $pending perubahan menunggu sinkron."
          : "Mode offline, menampilkan data terakhir.";
    }
    if (syncing) return "Menyinkronkan perubahan.";
    if (pending > 0) return "$pending perubahan menunggu sinkron.";
    return null;
  }
}

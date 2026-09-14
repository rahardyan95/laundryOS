import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../models/notification.dart";
import "../state/notification_controller.dart";
import "../theme/app_metrics.dart";
import "../theme/app_status_tones.dart";
import "../domain/status_kind.dart";
import "../widgets/app_scaffold.dart";
import "../widgets/async_section.dart";
import "../widgets/empty_state.dart";
import "../widgets/status_chip.dart";
import "../widgets/surface_card.dart";

/// Daftar pemberitahuan. Yang belum dibaca ditandai dua cara sekaligus, lencana
/// "Baru" dan ikon penuh, supaya tidak bergantung pada warna saja.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<NotificationController>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<NotificationController>();

    return AppScaffold(
      title: "Notifikasi",
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.screen,
          children: [
            AsyncSection(
              isLoading: controller.loading,
              isEmpty: controller.items.isEmpty,
              errorMessage: controller.error,
              onRetry: () => controller.refresh(),
              empty: const EmptyState(
                icon: Icons.notifications_none,
                message: "Belum ada notifikasi",
                hint:
                    "Pemberitahuan order baru, status selesai, dan tugas antar-jemput muncul di sini.",
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final item in controller.items) ...[
                    _NotificationCard(
                      item: item,
                      onTap: () => controller.markRead(item),
                    ),
                    const SizedBox(height: AppSpacing.listGap),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.item, required this.onTap});

  final AppNotification item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tone = StatusTones.of(context)
        .tone(item.unread ? StatusKind.info : StatusKind.neutral);

    return SurfaceCard(
      onTap: item.unread ? onTap : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration:
                BoxDecoration(color: tone.background, shape: BoxShape.circle),
            child: Icon(
              item.unread
                  ? Icons.notifications_active
                  : Icons.notifications_none,
              size: 20,
              color: tone.foreground,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child:
                          Text(item.title, style: theme.textTheme.titleMedium),
                    ),
                    if (item.unread) ...[
                      const SizedBox(width: AppSpacing.sm),
                      const StatusChip(label: "Baru", kind: StatusKind.info),
                    ],
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(item.body, style: theme.textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.xs),
                Text(Format.dateTime(item.createdAt),
                    style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

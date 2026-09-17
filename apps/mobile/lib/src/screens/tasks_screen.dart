import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../domain/task_machine.dart";
import "../models/delivery_task.dart";
import "../models/delivery_task_status.dart";
import "../state/delivery_task_controller.dart";
import "../theme/app_metrics.dart";
import "../theme/app_typography.dart";
import "../widgets/app_scaffold.dart";
import "../widgets/async_section.dart";
import "../widgets/empty_state.dart";
import "../widgets/status_chip.dart";
import "../widgets/surface_card.dart";

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<DeliveryTaskController>().refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DeliveryTaskController>();

    return AppScaffold(
      title: "Tugas Antar-Jemput",
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.screen,
          children: [
            if (controller.tasks.isNotEmpty) ...[
              const _FieldHint(),
              const SizedBox(height: AppSpacing.listGap),
            ],
            AsyncSection(
              isLoading: controller.loading,
              isEmpty: controller.tasks.isEmpty,
              errorMessage: controller.error,
              onRetry: () => controller.refresh(),
              empty: const EmptyState(
                icon: Icons.local_shipping_outlined,
                message: "Belum ada tugas untuk Anda",
                hint:
                    "Tugas antar-jemput yang ditugaskan dari web akan muncul di sini.",
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final task in controller.tasks) ...[
                    _TaskCard(task: task, controller: controller),
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

class _TaskCard extends StatelessWidget {
  const _TaskCard({required this.task, required this.controller});

  final DeliveryTask task;
  final DeliveryTaskController controller;

  Future<void> _uploadProof(BuildContext context) async {
    final ok = await controller.captureAndUploadProof(task);
    if (ok == null || !context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(ok ? "Bukti terunggah." : "Gagal mengunggah bukti.")),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final next = TaskMachine.next(task.status);

    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  TaskMachine.typeLabel(task.type),
                  style: theme.textTheme.titleMedium,
                ),
              ),
              StatusChip(
                  label: TaskMachine.label(task.status),
                  kind: TaskMachine.kind(task.status)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            task.orderTicket,
            style: AppTypography.mono(context,
                color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.place_outlined,
                  size: AppIconSizes.sm,
                  color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                  child: Text(task.address, style: theme.textTheme.bodyMedium)),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            children: [
              Icon(Icons.schedule_outlined,
                  size: AppIconSizes.sm,
                  color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  "Jadwal ${Format.dateTime(task.scheduledAt)}",
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
          ),
          if (task.proofUrl != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(Icons.photo_camera_outlined,
                    size: AppIconSizes.sm,
                    color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: AppSpacing.sm),
                Text("Bukti terunggah", style: theme.textTheme.bodySmall),
              ],
            ),
          ],
          if (next != null) ...[
            const SizedBox(height: AppSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (task.status == DeliveryTaskStatus.inProgress)
                  TextButton.icon(
                    onPressed: () => _uploadProof(context),
                    icon: const Icon(Icons.camera_alt_outlined,
                        size: AppIconSizes.sm),
                    label: const Text("Bukti"),
                  ),
                if (task.status == DeliveryTaskStatus.inProgress)
                  const SizedBox(width: AppSpacing.sm),
                FilledButton.tonal(
                  onPressed: () => controller.advance(task, next),
                  child: Text(TaskMachine.nextLabel(task.status)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Lembar bantuan singkat: apa yang harus dilakukan kurir di lapangan.
class _FieldHint extends StatelessWidget {
  const _FieldHint();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SurfaceCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline,
              size: AppIconSizes.sm,
              color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              "Mulai saat berangkat, lalu unggah foto bukti sebelum menekan Selesaikan.",
              style: theme.textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}

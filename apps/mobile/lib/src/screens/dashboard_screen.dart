import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../domain/order_machine.dart";
import "../models/dashboard.dart";
import "../models/order_status.dart";
import "../models/ready_waiting_item.dart";
import "../state/auth_controller.dart";
import "../state/dashboard_controller.dart";
import "../theme/app_metrics.dart";
import "../theme/app_typography.dart";
import "../widgets/app_scaffold.dart";
import "../widgets/async_section.dart";
import "../widgets/empty_state.dart";
import "../widgets/section_header.dart";
import "../widgets/stat_tile.dart";
import "../widgets/status_chip.dart";
import "../widgets/surface_card.dart";

/// Lima jawaban yang dicari pemilik saat membuka aplikasi: berapa order hari
/// ini, berapa penjualannya, berapa piutang, berapa kas, dan pekerjaan mana
/// yang tertahan. Tidak ada grafik karena tidak ada pertanyaan yang butuh grafik.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  void _load() {
    final outletId = context.read<AuthController>().session?.outletId;
    context.read<DashboardController>().load(outletId: outletId);
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<DashboardController>();
    final summary = controller.summary;

    return AppScaffold(
      title: "Dashboard",
      actions: [
        IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh),
            tooltip: "Muat ulang"),
      ],
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: ListView(
          padding: AppSpacing.screen,
          children: [
            AsyncSection(
              isLoading: controller.loading,
              isEmpty: summary == null,
              errorMessage: controller.error,
              onRetry: _load,
              empty: EmptyState(
                icon: Icons.query_stats_outlined,
                message: "Ringkasan belum bisa dimuat",
                hint:
                    "Pastikan server API berjalan, lalu tarik layar ke bawah untuk mencoba lagi.",
                action: FilledButton.tonal(
                  onPressed: _load,
                  child: const Text("Muat ulang"),
                ),
              ),
              child: summary == null
                  ? const SizedBox.shrink()
                  : _SummaryContent(summary: summary),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryContent extends StatelessWidget {
  const _SummaryContent({required this.summary});

  final DashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final active = summary.workload.where((item) => item.count > 0).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SectionHeader(
          title: "Hari ini",
          caption: "Sejak 00.00 untuk outlet ini",
        ),
        Row(
          children: [
            Expanded(
              child: StatTile(
                label: "Order masuk",
                value: "${summary.ordersToday}",
                isAmount: false,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
                child: StatTile(
                    label: "Penjualan",
                    value: Format.rupiah(summary.salesToday))),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
                child: StatTile(
                    label: "Piutang",
                    value: Format.rupiah(summary.outstanding))),
            const SizedBox(width: AppSpacing.md),
            Expanded(
                child: StatTile(
                    label: "Kas masuk",
                    value: Format.rupiah(summary.cashBalance))),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        const SectionHeader(
          title: "Beban kerja",
          caption: "Order yang sedang berjalan per tahap",
        ),
        if (active.isEmpty)
          Text("Tidak ada order berjalan.", style: theme.textTheme.bodySmall)
        else
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: active
                .map(
                  (item) => StatusChip(
                    label:
                        "${OrderMachine.label(OrderStatus.fromWire(item.status))} ${item.count}",
                    kind: OrderMachine.kind(OrderStatus.fromWire(item.status)),
                  ),
                )
                .toList(),
          ),
        const SizedBox(height: AppSpacing.xl),
        const SectionHeader(
          title: "Perlu dihubungi",
          caption: "Sudah siap diambil lebih dari 12 jam",
        ),
        if (summary.readyWaiting.isEmpty)
          Text("Tidak ada cucian yang menunggu lebih dari 12 jam.",
              style: theme.textTheme.bodySmall)
        else
          SurfaceCard(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
            child: Column(
              children: [
                for (var index = 0;
                    index < summary.readyWaiting.length;
                    index++) ...[
                  if (index > 0) const Divider(),
                  _ReadyRow(item: summary.readyWaiting[index]),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

class _ReadyRow extends StatelessWidget {
  const _ReadyRow({required this.item});

  final ReadyWaitingItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.ticket,
                    style: AppTypography.mono(context,
                        color: theme.colorScheme.onSurface)),
                const SizedBox(height: AppSpacing.labelGap),
                Text(item.customerName, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
          StatusChip(
              label: "${item.hoursWaiting} jam",
              kind: OrderMachine.kind(OrderStatus.ready)),
        ],
      ),
    );
  }
}

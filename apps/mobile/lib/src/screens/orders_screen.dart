import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../domain/order_card_policy.dart";
import "../domain/order_machine.dart";
import "../models/order.dart";
import "../models/role.dart";
import "../state/auth_controller.dart";
import "../state/order_controller.dart";
import "../theme/app_metrics.dart";
import "../theme/app_typography.dart";
import "../widgets/app_scaffold.dart";
import "../widgets/async_section.dart";
import "../widgets/empty_state.dart";
import "../widgets/status_chip.dart";
import "../widgets/surface_card.dart";
import "new_order_screen.dart";

/// Antrean order. Tiap baris menjawab empat hal sebelum dibuka: tiket apa,
/// pelanggan siapa, tahap berapa, dan uangnya sudah masuk berapa.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<OrderController>().refresh();
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.hasClients &&
        _scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      context.read<OrderController>().loadMore();
    }
  }

  Future<void> _openNewOrder() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const NewOrderScreen()),
    );
    if (created == true && mounted) {
      await context.read<OrderController>().refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select<AuthController, Role>(
      (auth) => auth.session?.role ?? Role.cashier,
    );
    final controller = context.watch<OrderController>();

    return AppScaffold(
      title: "Order",
      floatingActionButton: role.canCreateOrder
          ? FloatingActionButton.extended(
              onPressed: _openNewOrder,
              icon: const Icon(Icons.add),
              label: const Text("Order Baru"),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => controller.refresh(),
        child: ListView(
          controller: _scroll,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.screen,
          children: [
            AsyncSection(
              isLoading: controller.loading,
              isLoadingMore: controller.loadingMore,
              isEmpty: controller.orders.isEmpty,
              errorMessage: controller.error,
              onRetry: () => controller.refresh(),
              empty: EmptyState(
                icon: Icons.receipt_long_outlined,
                message: "Belum ada order di outlet ini",
                hint: role.canCreateOrder
                    ? "Tekan Order Baru untuk mencatat cucian pertama hari ini."
                    : "Order yang dibuat kasir akan muncul di sini.",
                action: role.canCreateOrder
                    ? FilledButton.tonal(
                        onPressed: _openNewOrder,
                        child: const Text("Order Baru"))
                    : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  for (final order in controller.orders) ...[
                    _OrderCard(
                        role: role, order: order, controller: controller),
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

class _OrderCard extends StatelessWidget {
  const _OrderCard(
      {required this.role, required this.order, required this.controller});

  final Role role;
  final Order order;
  final OrderController controller;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final next = OrderCardPolicy.nextOf(order);
    final canAdvance = OrderCardPolicy.canAdvance(role, order);
    final canCancel = OrderCardPolicy.canCancel(role, order);
    final isPaid = OrderCardPolicy.isPaid(order);

    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.ticket,
                  style: AppTypography.mono(context,
                      color: theme.colorScheme.onSurface),
                ),
              ),
              StatusChip(
                  label: OrderMachine.label(order.status),
                  kind: OrderMachine.kind(order.status)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(order.customerName, style: theme.textTheme.bodyMedium),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: Text(
                  Format.rupiah(order.total),
                  style: AppTypography.amount(context,
                      color: theme.colorScheme.onSurface),
                ),
              ),
              StatusChip(
                label: OrderMachine.paymentLabel(order.paymentStatus),
                kind: OrderMachine.paymentKind(order.paymentStatus),
                outlined: !isPaid,
              ),
            ],
          ),
          if (canAdvance || canCancel) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (canCancel)
                  TextButton(
                      onPressed: () => controller.cancel(order),
                      child: const Text("Batalkan")),
                if (canCancel && canAdvance)
                  const SizedBox(width: AppSpacing.sm),
                if (canAdvance)
                  FilledButton.tonal(
                    onPressed: () => controller.advance(order),
                    child: Text("Ke ${OrderMachine.label(next!)}"),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

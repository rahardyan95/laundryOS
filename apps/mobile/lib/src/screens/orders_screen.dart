import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "package:laundryos_mobile/src/domain/order_machine.dart";
import "package:laundryos_mobile/src/models/order.dart";
import "package:laundryos_mobile/src/models/role.dart";

import "../state/auth_controller.dart";
import "../state/order_controller.dart";
import "../widgets/logout_button.dart";
import "new_order_screen.dart";

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
    final role = context.select<AuthController, Role>((auth) => auth.session?.role ?? Role.cashier);
    final controller = context.watch<OrderController>();

    return Scaffold(
      appBar: AppBar(title: const Text("Order"), actions: const [LogoutButton()]),
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
          padding: const EdgeInsets.all(16),
          children: [
            if (controller.error != null)
              Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(padding: const EdgeInsets.all(12), child: Text(controller.error!)),
              ),
            if (controller.loading && controller.orders.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (controller.orders.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text("Belum ada order.")),
              )
            else
              ...controller.orders.map(
                (order) => _OrderCard(role: role, order: order, controller: controller),
              ),
            if (controller.loadingMore)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              ),
          ],
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.role, required this.order, required this.controller});

  final Role role;
  final Order order;
  final OrderController controller;

  @override
  Widget build(BuildContext context) {
    final next = OrderMachine.next(order.status);
    final canAdvance = role.canAdvanceOrder && next != null;
    final canCancel = role.canCancelOrder && order.status == OrderStatus.received;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    order.ticket,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: "monospace"),
                  ),
                ),
                Chip(
                  label: Text(OrderMachine.label(order.status)),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(order.customerName),
            const SizedBox(height: 4),
            Text(
              "Rp${order.total} · ${OrderMachine.paymentLabel(order.paymentStatus)}",
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (canAdvance || canCancel)
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (canCancel)
                    TextButton(
                      onPressed: () => controller.cancel(order),
                      child: const Text("Batalkan"),
                    ),
                  if (canAdvance)
                    FilledButton.tonal(
                      onPressed: () => controller.advance(order),
                      child: Text("Ke ${OrderMachine.label(next)}"),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

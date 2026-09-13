import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "package:laundryos_mobile/src/lib/order_machine.dart";
import "../models/order.dart";
import "../models/role.dart";
import "../state/auth_controller.dart";
import "../state/order_controller.dart";

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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
    if (!_scroll.hasClients) return;
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200) {
      context.read<OrderController>().loadMore();
    }
  }

  Future<void> _logout() async {
    await context.read<AuthController>().logout();
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select<AuthController, Role>(
      (auth) => auth.session?.role ?? Role.cashier,
    );
    final name = context.select<AuthController, String>(
      (auth) => auth.session?.name ?? "",
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(role.isDriver ? "Tugas Antar-Jemput" : "Order"),
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout), tooltip: "Keluar"),
        ],
      ),
      body: role.isDriver
          ? _DriverPlaceholder(name: name)
          : _OrdersView(role: role, scroll: _scroll, name: name),
    );
  }
}

class _OrdersView extends StatelessWidget {
  const _OrdersView({required this.role, required this.scroll, required this.name});

  final Role role;
  final ScrollController scroll;
  final String name;

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<OrderController>();

    return RefreshIndicator(
      onRefresh: () => controller.refresh(),
      child: ListView(
        controller: scroll,
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          Text("Halo, $name", style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          if (controller.error != null)
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(controller.error!),
              ),
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

class _DriverPlaceholder extends StatelessWidget {
  const _DriverPlaceholder({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.local_shipping_outlined, size: 48),
            const SizedBox(height: 12),
            Text("Halo, $name", style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            const Text(
              "Daftar tugas antar-jemput sedang disiapkan.",
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../domain/format.dart";
import "../domain/order_machine.dart";
import "../models/order.dart";
import "../state/auth_controller.dart";
import "../state/dashboard_controller.dart";
import "../widgets/logout_button.dart";

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

    return Scaffold(
      appBar: AppBar(
        title: const Text("Dashboard"),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh), tooltip: "Muat ulang"),
          const LogoutButton(),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _load(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (controller.error != null)
              Card(
                color: Theme.of(context).colorScheme.errorContainer,
                child: Padding(padding: const EdgeInsets.all(12), child: Text(controller.error!)),
              ),
            if (controller.loading && controller.summary == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (controller.summary == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(child: Text("Tidak ada data.")),
              )
            else
              ..._content(context, controller),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(BuildContext context, DashboardController controller) {
    final summary = controller.summary!;
    return [
      Row(
        children: [
          Expanded(child: _Kpi(label: "Order hari ini", value: "${summary.ordersToday}")),
          const SizedBox(width: 12),
          Expanded(child: _Kpi(label: "Penjualan hari ini", value: Format.rupiah(summary.salesToday))),
        ],
      ),
      const SizedBox(height: 12),
      Row(
        children: [
          Expanded(child: _Kpi(label: "Piutang", value: Format.rupiah(summary.outstanding))),
          const SizedBox(width: 12),
          Expanded(child: _Kpi(label: "Kas masuk", value: Format.rupiah(summary.cashBalance))),
        ],
      ),
      const SizedBox(height: 20),
      Text("Beban kerja", style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: summary.workload
            .where((item) => item.count > 0)
            .map(
              (item) => Chip(
                label: Text(
                  "${OrderMachine.label(OrderStatus.fromWire(item.status))}: ${item.count}",
                ),
              ),
            )
            .toList(),
      ),
      const SizedBox(height: 20),
      Text("Siap diambil > 12 jam", style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      if (summary.readyWaiting.isEmpty)
        const Text("Tidak ada.")
      else
        ...summary.readyWaiting.map(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(item.ticket, style: const TextStyle(fontFamily: "monospace")),
            subtitle: Text("${item.customerName} · ${item.hoursWaiting} jam"),
          ),
        ),
    ];
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 6),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
    );
  }
}

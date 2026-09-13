import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../models/role.dart";
import "../state/auth_controller.dart";
import "../state/connectivity_controller.dart";
import "../state/sync_controller.dart";
import "dashboard_screen.dart";
import "notifications_screen.dart";
import "orders_screen.dart";
import "tasks_screen.dart";

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final role = context.select<AuthController, Role>(
      (auth) => auth.session?.role ?? Role.cashier,
    );
    final tabs = _tabsFor(role);
    final index = _index.clamp(0, tabs.length - 1);

    final offline = context.select<ConnectivityController, bool>(
      (connectivity) => !connectivity.isOnline,
    );
    final sync = context.watch<SyncController>();
    final banner = _bannerText(offline, sync);

    return Scaffold(
      body: Column(
        children: [
          if (banner != null)
            Material(
              color: offline
                  ? Theme.of(context).colorScheme.errorContainer
                  : Theme.of(context).colorScheme.secondaryContainer,
              child: SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                  child: Text(banner, textAlign: TextAlign.center),
                ),
              ),
            ),
          Expanded(
            child: IndexedStack(
              index: index,
              children: tabs.map((tab) => tab.screen).toList(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: tabs
            .map((tab) => NavigationDestination(icon: Icon(tab.icon), label: tab.label))
            .toList(),
      ),
    );
  }

  String? _bannerText(bool offline, SyncController sync) {
    if (offline) {
      return sync.pending > 0
          ? "Mode offline — ${sync.pending} perubahan menunggu sinkron."
          : "Mode offline — menampilkan data terakhir.";
    }
    if (sync.syncing) return "Menyinkronkan perubahan…";
    if (sync.pending > 0) return "${sync.pending} perubahan menunggu sinkron.";
    return null;
  }

  List<_Tab> _tabsFor(Role role) {
    const notifications =
        _Tab(Icons.notifications_outlined, "Notifikasi", NotificationsScreen());
    if (role.isDriver) {
      return [
        const _Tab(Icons.local_shipping_outlined, "Tugas", TasksScreen()),
        notifications,
      ];
    }
    if (role.canViewDashboard) {
      return [
        const _Tab(Icons.dashboard_outlined, "Dashboard", DashboardScreen()),
        const _Tab(Icons.receipt_long_outlined, "Order", OrdersScreen()),
        notifications,
      ];
    }
    return [
      const _Tab(Icons.receipt_long_outlined, "Order", OrdersScreen()),
      notifications,
    ];
  }
}

class _Tab {
  const _Tab(this.icon, this.label, this.screen);

  final IconData icon;
  final String label;
  final Widget screen;
}

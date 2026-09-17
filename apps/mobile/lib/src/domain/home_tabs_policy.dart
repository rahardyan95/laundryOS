import "../models/role.dart";

/// Tab navigasi bawah per peran. Kurir hanya butuh Tugas + Notifikasi,
/// pemilik/manajer dapat Dashboard, sisanya Order + Notifikasi.
class HomeTabsPolicy {
  const HomeTabsPolicy._();

  static List<HomeTabKind> tabsFor(Role role) {
    if (role.isDriver) {
      return const [HomeTabKind.tasks, HomeTabKind.notifications];
    }
    if (role.canViewDashboard) {
      return const [
        HomeTabKind.dashboard,
        HomeTabKind.orders,
        HomeTabKind.notifications
      ];
    }
    return const [HomeTabKind.orders, HomeTabKind.notifications];
  }
}

enum HomeTabKind { dashboard, orders, tasks, notifications }

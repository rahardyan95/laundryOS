enum Role {
  owner,
  manager,
  cashier,
  operator,
  driver;

  static Role fromWire(String value) {
    return Role.values.firstWhere(
      (role) => role.name == value,
      orElse: () => Role.cashier,
    );
  }

  String get label => switch (this) {
        Role.owner => "Pemilik",
        Role.manager => "Manajer",
        Role.cashier => "Kasir",
        Role.operator => "Operator",
        Role.driver => "Kurir",
      };

  bool get canViewDashboard => this == Role.owner || this == Role.manager;

  bool get canCreateOrder =>
      this == Role.owner || this == Role.manager || this == Role.cashier;

  bool get canAdvanceOrder =>
      this == Role.owner || this == Role.manager || this == Role.operator;

  bool get canCancelOrder =>
      this == Role.owner || this == Role.manager || this == Role.cashier;

  bool get canViewOrders =>
      this == Role.owner ||
      this == Role.manager ||
      this == Role.cashier ||
      this == Role.operator;

  bool get isDriver => this == Role.driver;
}

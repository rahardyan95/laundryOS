enum OrderStatus {
  received,
  washing,
  drying,
  ironing,
  ready,
  completed,
  cancelled;

  static OrderStatus fromWire(String value) {
    return OrderStatus.values.firstWhere(
      (status) => status.name == value,
      orElse: () => OrderStatus.received,
    );
  }
}

enum DeliveryTaskStatus {
  pending("pending"),
  assigned("assigned"),
  inProgress("in_progress"),
  done("done"),
  cancelled("cancelled");

  const DeliveryTaskStatus(this.wire);

  final String wire;

  static DeliveryTaskStatus fromWire(String value) {
    return DeliveryTaskStatus.values.firstWhere(
      (status) => status.wire == value,
      orElse: () => DeliveryTaskStatus.pending,
    );
  }
}

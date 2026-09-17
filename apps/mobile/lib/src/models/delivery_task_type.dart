enum DeliveryTaskType {
  pickup("pickup"),
  delivery("delivery");

  const DeliveryTaskType(this.wire);

  final String wire;

  static DeliveryTaskType fromWire(String value) {
    return DeliveryTaskType.values.firstWhere(
      (type) => type.wire == value,
      orElse: () => DeliveryTaskType.pickup,
    );
  }
}

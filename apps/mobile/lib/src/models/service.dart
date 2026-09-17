class Service {
  const Service({
    required this.id,
    required this.name,
    required this.unit,
    required this.pricePerUnit,
    required this.active,
  });

  final String id;
  final String name;
  final String unit;
  final int pricePerUnit;
  final bool active;

  factory Service.fromJson(Map<String, dynamic> json) => Service(
        id: json["id"].toString(),
        name: json["name"] as String? ?? "-",
        unit: json["unit"] as String? ?? "kg",
        pricePerUnit: (json["price_per_unit"] as num?)?.toInt() ?? 0,
        active: json["active"] as bool? ?? true,
      );
}

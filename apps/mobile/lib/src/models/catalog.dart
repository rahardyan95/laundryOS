class Customer {
  const Customer({required this.id, required this.name, required this.phone});

  final String id;
  final String name;
  final String phone;

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
        id: json["id"].toString(),
        name: json["name"] as String? ?? "-",
        phone: json["phone"] as String? ?? "-",
      );
}

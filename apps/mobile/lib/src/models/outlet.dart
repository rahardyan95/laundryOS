class Outlet {
  const Outlet({required this.id, required this.name, required this.code});

  final String id;
  final String name;
  final String code;

  factory Outlet.fromJson(Map<String, dynamic> json) => Outlet(
        id: json["id"].toString(),
        name: json["name"] as String? ?? "-",
        code: json["code"] as String? ?? "-",
      );
}

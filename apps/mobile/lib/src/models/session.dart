import "outlet.dart";
import "role.dart";

class SessionPayload {
  const SessionPayload({
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.tenantId,
    required this.outletId,
    required this.outlets,
  });

  final String userId;
  final String name;
  final String email;
  final Role role;
  final String tenantId;
  final String outletId;
  final List<Outlet> outlets;

  factory SessionPayload.fromMeJson(Map<String, dynamic> json) {
    final user = json["user"] as Map<String, dynamic>;
    final tenant = json["tenant"] as Map<String, dynamic>;
    final outlets = (json["outlets"] as List? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Outlet.fromJson)
        .toList();
    return SessionPayload(
      userId: user["id"].toString(),
      name: user["name"] as String? ?? "-",
      email: user["email"] as String? ?? "-",
      role: Role.fromWire(user["role"] as String? ?? "cashier"),
      tenantId: tenant["id"].toString(),
      outletId: (user["outlet_id"] ?? "").toString(),
      outlets: outlets,
    );
  }
}

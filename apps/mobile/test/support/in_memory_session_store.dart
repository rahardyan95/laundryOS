import "package:laundryos_mobile/src/api/session_store.dart";

class InMemorySessionStore implements SessionStore {
  String? _token;
  String? _user;
  String? _outlet;

  @override
  Future<void> clear() async {
    _token = null;
    _user = null;
    _outlet = null;
  }

  @override
  Future<String?> outletId() async => _outlet;

  @override
  Future<void> saveOutlet(String outletId) async => _outlet = outletId;

  @override
  Future<void> saveToken(String token) async => _token = token;

  @override
  Future<void> saveUser(String json) async => _user = json;

  @override
  Future<String?> token() async => _token;

  @override
  Future<String?> user() async => _user;
}

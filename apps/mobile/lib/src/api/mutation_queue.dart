import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

/// Mutasi yang gagal terkirim dan menunggu dikirim ulang.
///
/// [userId] mengikat mutasi pada identitas yang membuatnya: mutasi milik
/// pengguna lain tidak boleh terkirim dengan token sesi sekarang.
class PendingMutation {
  const PendingMutation({
    required this.method,
    required this.path,
    required this.idempotencyKey,
    required this.userId,
    this.body,
  });

  final String method;
  final String path;
  final String idempotencyKey;
  final String? userId;
  final Object? body;

  Map<String, dynamic> toJson() => {
        "method": method,
        "path": path,
        "key": idempotencyKey,
        "user_id": userId,
        "body": body,
      };

  factory PendingMutation.fromJson(Map<String, dynamic> json) =>
      PendingMutation(
        method: json["method"] as String,
        path: json["path"] as String,
        idempotencyKey: json["key"] as String,
        userId: json["user_id"] as String?,
        body: json["body"],
      );
}

abstract class MutationQueue {
  Future<List<PendingMutation>> all();
  Future<void> enqueue(PendingMutation mutation);
  Future<void> remove(String idempotencyKey);
  Future<void> clear();
}

class SharedPrefsMutationQueue implements MutationQueue {
  static const _storeKey = "laundryos.mutations";

  /// Galat baca sengaja tidak ditelan: mengembalikan daftar kosong di sini
  /// membuat `enqueue` menimpa antrean lama dan mutasi hilang tanpa jejak.
  Future<List<PendingMutation>> _read() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storeKey);
    if (raw == null || raw.isEmpty) return [];
    return (jsonDecode(raw) as List)
        .whereType<Map<String, dynamic>>()
        .map(PendingMutation.fromJson)
        .toList();
  }

  /// Galat tulis juga tidak ditelan: enqueue yang gagal harus terlihat oleh
  /// pemanggil, bukan melapor seolah mutasi sudah tersimpan.
  Future<void> _write(List<PendingMutation> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _storeKey, jsonEncode(items.map((e) => e.toJson()).toList()));
  }

  @override
  Future<List<PendingMutation>> all() => _read();

  @override
  Future<void> enqueue(PendingMutation mutation) async {
    final items = await _read()
      ..removeWhere((item) => item.idempotencyKey == mutation.idempotencyKey)
      ..add(mutation);
    await _write(items);
  }

  @override
  Future<void> remove(String idempotencyKey) async {
    final items = await _read()
      ..removeWhere((item) => item.idempotencyKey == idempotencyKey);
    await _write(items);
  }

  @override
  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storeKey);
  }
}

class InMemoryMutationQueue implements MutationQueue {
  final List<PendingMutation> _items = [];

  @override
  Future<List<PendingMutation>> all() async => List.unmodifiable(_items);

  @override
  Future<void> enqueue(PendingMutation mutation) async {
    _items
      ..removeWhere((item) => item.idempotencyKey == mutation.idempotencyKey)
      ..add(mutation);
  }

  @override
  Future<void> remove(String idempotencyKey) async {
    _items.removeWhere((item) => item.idempotencyKey == idempotencyKey);
  }

  @override
  Future<void> clear() async => _items.clear();
}

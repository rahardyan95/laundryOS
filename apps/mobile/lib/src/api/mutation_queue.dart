import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

class PendingMutation {
  const PendingMutation({
    required this.method,
    required this.path,
    required this.idempotencyKey,
    this.body,
  });

  final String method;
  final String path;
  final String idempotencyKey;
  final Object? body;

  Map<String, dynamic> toJson() => {
        "method": method,
        "path": path,
        "key": idempotencyKey,
        "body": body,
      };

  factory PendingMutation.fromJson(Map<String, dynamic> json) => PendingMutation(
        method: json["method"] as String,
        path: json["path"] as String,
        idempotencyKey: json["key"] as String,
        body: json["body"],
      );
}

abstract class MutationQueue {
  Future<List<PendingMutation>> all();
  Future<void> enqueue(PendingMutation mutation);
  Future<void> remove(String idempotencyKey);
}

class SharedPrefsMutationQueue implements MutationQueue {
  static const _storeKey = "laundryos.mutations";

  Future<List<PendingMutation>> _read() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storeKey);
      if (raw == null || raw.isEmpty) return [];
      return (jsonDecode(raw) as List)
          .whereType<Map<String, dynamic>>()
          .map(PendingMutation.fromJson)
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _write(List<PendingMutation> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storeKey, jsonEncode(items.map((e) => e.toJson()).toList()));
    } catch (_) {
      // abaikan: tanpa storage, antrean tidak persisten.
    }
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
    final items = await _read()..removeWhere((item) => item.idempotencyKey == idempotencyKey);
    await _write(items);
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
}

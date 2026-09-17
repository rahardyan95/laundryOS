import "dart:convert";

import "package:shared_preferences/shared_preferences.dart";

import "mutation_queue.dart";
import "pending_mutation.dart";

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

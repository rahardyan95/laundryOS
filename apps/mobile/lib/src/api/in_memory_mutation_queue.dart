import "mutation_queue.dart";
import "pending_mutation.dart";

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

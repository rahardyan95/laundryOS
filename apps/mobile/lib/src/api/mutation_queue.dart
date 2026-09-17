import "pending_mutation.dart";

abstract class MutationQueue {
  Future<List<PendingMutation>> all();
  Future<void> enqueue(PendingMutation mutation);
  Future<void> remove(String idempotencyKey);
  Future<void> clear();
}

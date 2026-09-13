import "package:flutter/foundation.dart";

import "../api/api_exception.dart";
import "../models/delivery_task.dart";
import "../repositories/delivery_task_repository.dart";

class DeliveryTaskController extends ChangeNotifier {
  DeliveryTaskController(this._repository);

  final DeliveryTaskRepository _repository;

  final List<DeliveryTask> _tasks = [];
  List<DeliveryTask> get tasks => List.unmodifiable(_tasks);

  bool _loading = false;
  String? _error;
  int _page = 1;
  int _lastPage = 1;

  bool get loading => _loading;
  String? get error => _error;
  bool get hasMore => _page < _lastPage;

  Future<void> refresh() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _repository.page(page: 1);
      _tasks
        ..clear()
        ..addAll(result.tasks);
      _page = result.currentPage;
      _lastPage = result.lastPage;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = "Gagal memuat tugas.";
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_loading || !hasMore) return;
    try {
      final result = await _repository.page(page: _page + 1);
      _tasks.addAll(result.tasks);
      _page = result.currentPage;
      _lastPage = result.lastPage;
      notifyListeners();
    } on ApiException catch (error) {
      _error = error.message;
      notifyListeners();
    }
  }

  Future<bool> advance(DeliveryTask task, DeliveryTaskStatus status) async {
    try {
      final updated = await _repository.advance(task.id, status);
      _replace(updated);
      return true;
    } on QueuedOfflineException catch (error) {
      _error = error.message;
      notifyListeners();
      return false;
    } on ApiException catch (error) {
      _error = error.message;
      notifyListeners();
      return false;
    }
  }

  Future<bool> uploadProof(DeliveryTask task, {required List<int> bytes, required String filename}) async {
    try {
      final updated = await _repository.uploadProof(task.id, bytes: bytes, filename: filename);
      _replace(updated);
      return true;
    } on ApiException catch (error) {
      _error = error.message;
      notifyListeners();
      return false;
    }
  }

  void _replace(DeliveryTask updated) {
    final index = _tasks.indexWhere((task) => task.id == updated.id);
    if (index != -1) _tasks[index] = updated;
    notifyListeners();
  }
}

import "package:flutter/foundation.dart";

import "../api/api_exception.dart";
import "../models/order.dart";
import "../repositories/order_repository.dart";

class OrderController extends ChangeNotifier {
  OrderController(this._repository);

  final OrderRepository _repository;

  final List<Order> _orders = [];
  List<Order> get orders => List.unmodifiable(_orders);

  bool _loading = false;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  int _lastPage = 1;

  bool get loading => _loading;
  bool get loadingMore => _loadingMore;
  String? get error => _error;
  bool get hasMore => _page < _lastPage;

  Future<void> refresh({OrderStatus? status}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final result = await _repository.page(page: 1, status: status);
      _orders
        ..clear()
        ..addAll(result.orders);
      _page = result.currentPage;
      _lastPage = result.lastPage;
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = "Gagal memuat order.";
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore({OrderStatus? status}) async {
    if (_loadingMore || !hasMore) return;
    _loadingMore = true;
    notifyListeners();
    try {
      final result = await _repository.page(page: _page + 1, status: status);
      _orders.addAll(result.orders);
      _page = result.currentPage;
      _lastPage = result.lastPage;
    } on ApiException catch (error) {
      _error = error.message;
    } finally {
      _loadingMore = false;
      notifyListeners();
    }
  }

  Future<bool> advance(Order order, {String? note}) => _mutate(() => _repository.advance(order.id, note: note));

  Future<bool> cancel(Order order, {String? note}) => _mutate(() => _repository.cancel(order.id, note: note));

  Future<bool> _mutate(Future<Order> Function() action) async {
    try {
      final updated = await action();
      final index = _orders.indexWhere((order) => order.id == updated.id);
      if (index != -1) {
        _orders[index] = updated;
        notifyListeners();
      }
      return true;
    } on ApiException catch (error) {
      _error = error.message;
      notifyListeners();
      return false;
    }
  }
}

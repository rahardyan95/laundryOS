import "package:flutter/foundation.dart";

import "../models/notification.dart";
import "../repositories/notification_repository.dart";

class NotificationController extends ChangeNotifier {
  NotificationController(this._repository);

  final NotificationRepository _repository;

  List<AppNotification> _items = [];
  int _unread = 0;
  bool _loading = false;

  List<AppNotification> get items => List.unmodifiable(_items);
  int get unread => _unread;
  bool get loading => _loading;

  Future<void> refresh() async {
    _loading = true;
    notifyListeners();
    try {
      _items = await _repository.list();
      _unread = await _repository.unread();
    } catch (_) {
      // biarkan data lama; badge bukan alur kritis
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(AppNotification notification) async {
    if (!notification.unread) return;
    await _repository.markRead(notification.id);
    await refresh();
  }
}

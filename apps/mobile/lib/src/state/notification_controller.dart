import "package:flutter/foundation.dart";

import "../api/api_exception.dart";
import "../models/notification.dart";
import "../repositories/notification_repository.dart";

class NotificationController extends ChangeNotifier {
  NotificationController(this._repository);

  final NotificationRepository _repository;

  List<AppNotification> _items = [];
  int _unread = 0;
  bool _loading = false;
  String? _error;

  List<AppNotification> get items => List.unmodifiable(_items);
  int get unread => _unread;
  bool get loading => _loading;

  /// Pesan galat pemuatan terakhir. Layar menampilkannya sebagai pesan yang
  /// bisa dicoba ulang, bukan diam-diam menampilkan daftar kosong.
  String? get error => _error;

  Future<void> refresh() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _items = await _repository.list();
      _unread = await _repository.unread();
    } on ApiException catch (error) {
      _error = error.message;
    } catch (_) {
      _error = "Gagal memuat notifikasi.";
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

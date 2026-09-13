import "../api/api_client.dart";
import "../api/api_exception.dart";
import "../models/notification.dart";

class NotificationRepository {
  NotificationRepository(this._api, this._tokenProvider);

  final ApiClient _api;
  final Future<String?> Function() _tokenProvider;

  Future<List<AppNotification>> list() async => _api.listNotifications(await _token());

  Future<int> unread() async => _api.unreadCount(await _token());

  Future<void> markRead(String id) async => _api.markNotificationRead(await _token(), id);

  Future<String> _token() async {
    final token = await _tokenProvider();
    if (token == null) throw ApiException(401, "Sesi berakhir. Silakan masuk kembali.");
    return token;
  }
}

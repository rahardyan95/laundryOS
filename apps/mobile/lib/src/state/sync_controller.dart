import "package:flutter/foundation.dart";

import "../api/offline_api_transport.dart";
import "connectivity_controller.dart";

class SyncController extends ChangeNotifier {
  SyncController(this._offline, this._connectivity) {
    _connectivity.addListener(_onConnectivity);
    _refreshPending();
  }

  final OfflineApiTransport _offline;
  final ConnectivityController _connectivity;

  int _pending = 0;
  bool _syncing = false;
  int _lastSynced = 0;

  int get pending => _pending;
  bool get syncing => _syncing;
  int get lastSynced => _lastSynced;

  Future<void> _refreshPending() async {
    try {
      _pending = (await _offline.pending()).length;
    } catch (_) {
      _pending = 0;
    }
    notifyListeners();
  }

  /// Dipanggil sekali setelah sesi dipulihkan. Bila memang sudah online,
  /// antrean dikirim sekarang: `ConnectivityController` mulai dari keadaan
  /// "online", jadi tidak ada transisi yang bisa diandalkan untuk memicunya.
  Future<void> start() async {
    await _refreshPending();
    if (_connectivity.isOnline) {
      await flush();
    }
  }

  void _onConnectivity() {
    if (_connectivity.isOnline) {
      flush();
    } else {
      _refreshPending();
    }
  }

  Future<void> flush() async {
    if (_syncing) return;
    _syncing = true;
    notifyListeners();
    try {
      _lastSynced = await _offline.flush();
    } catch (_) {
      _lastSynced = 0;
    } finally {
      await _refreshPending();
      _syncing = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connectivity.removeListener(_onConnectivity);
    super.dispose();
  }
}

/// Mutasi disimpan lokal saat offline dan akan dikirim ulang saat online.
class QueuedOfflineException implements Exception {
  QueuedOfflineException(
      [this.message = "Offline, perubahan disimpan dan akan disinkronkan."]);

  final String message;

  @override
  String toString() => message;
}

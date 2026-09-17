/// Pesan pita sinkronisasi. Hanya muncul saat ada yang perlu diketahui:
/// sedang offline, sedang menyinkronkan, atau ada perubahan belum terkirim.
class SyncMessage {
  const SyncMessage._();

  static String? messageFor({
    required bool offline,
    required int pending,
    required bool syncing,
  }) {
    if (offline) {
      return pending > 0
          ? "Mode offline, $pending perubahan menunggu sinkron."
          : "Mode offline, menampilkan data terakhir.";
    }
    if (syncing) return "Menyinkronkan perubahan.";
    if (pending > 0) return "$pending perubahan menunggu sinkron.";
    return null;
  }
}

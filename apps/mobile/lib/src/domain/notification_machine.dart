import "status_kind.dart";

/// Arti visual notifikasi: belum dibaca = info, sudah dibaca = netral.
/// Widget memakai StatusChip/StatusTones, bukan hex (R1.5).
class NotificationMachine {
  const NotificationMachine._();

  static StatusKind kind(bool unread) {
    return unread ? StatusKind.info : StatusKind.neutral;
  }
}

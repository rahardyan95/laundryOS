/// Makna visual sebuah status, dipisahkan dari warnanya.
///
/// Domain memutuskan *arti* status ([StatusKind]); tema memutuskan *warna*-nya.
/// Pemisahan ini yang membuat `domain/` tetap Dart murni (tanpa Flutter) dan
/// membuat palet status bisa berubah tanpa menyentuh aturan bisnis.
enum StatusKind {
  /// Belum ada tindakan, netral.
  neutral,

  /// Sedang diproses sistem.
  info,

  /// Butuh perhatian, belum terlambat.
  warning,

  /// Tahap khusus yang perlu dibedakan dari tahap biasa.
  attention,

  /// Selesai atau berhasil.
  positive,

  /// Gagal, dibatalkan, atau bermasalah.
  negative,

  /// Status andalan produk (mis. siap diambil).
  brand,
}

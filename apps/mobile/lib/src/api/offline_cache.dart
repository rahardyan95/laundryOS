/// Cache respons GET terakhir agar aplikasi tetap menampilkan data saat offline.
///
/// Cache terikat pada identitas pengguna (lihat `CachingApiTransport`): data
/// milik satu pengguna tidak boleh tampil untuk pengguna lain di perangkat yang
/// sama, jadi entri juga dibuang saat keluar.
abstract class OfflineCache {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> clear();
}

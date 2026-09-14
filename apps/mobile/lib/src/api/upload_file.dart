/// Berkas yang dikirim lewat multipart: isi biner + nama yang dilihat server.
///
/// [filename] wajib ada. PHP hanya membaca sebuah part multipart sebagai berkas
/// unggahan bila part itu punya parameter `filename`; tanpa itu part dibaca
/// sebagai field biasa dan validasi berkas (mis. `image`) gagal dengan 422.
class UploadFile {
  const UploadFile({required this.filename, required this.bytes})
      : assert(filename != '', 'filename wajib diisi');

  /// Nama berkas asli, dipakai server untuk mengenali jenis berkas.
  final String filename;

  final List<int> bytes;
}

import "package:intl/date_symbol_data_local.dart";
import "package:intl/intl.dart";

/// Pemformat angka dan tanggal untuk seluruh aplikasi.
///
/// Dua hal yang dijaga kelas ini:
/// 1. Angka rupiah selalu memakai locale Indonesia dan tanpa desimal.
/// 2. Nama bulan tidak pernah membuat layar gagal. Simbol tanggal `intl`
///    dimuat asinkron, jadi [initialize] dipanggil saat bootstrap; sebelum itu
///    (widget test, atau frame pertama sebelum bootstrap selesai) pemformat
///    jatuh ke pola tanpa locale yang simbolnya selalu tersedia.
class Format {
  const Format._();

  static bool _dateSymbolsReady = false;

  /// Memuat simbol tanggal locale Indonesia. Panggil sekali di `main.dart`.
  static Future<void> initialize() async {
    await initializeDateFormatting("id_ID");
    _dateSymbolsReady = true;
  }

  static final NumberFormat _rupiah = NumberFormat.currency(
    locale: "id_ID",
    symbol: "Rp",
    decimalDigits: 0,
  );

  // Dibuat lazy: konstruksi `DateFormat` ber-locale melempar bila simbol belum
  // dimuat, jadi objek ini hanya disentuh setelah [initialize] selesai.
  static final DateFormat _dateTimeIndonesian = DateFormat("d MMM yyyy, HH:mm", "id_ID");
  static final DateFormat _dateIndonesian = DateFormat("d MMM yyyy", "id_ID");

  static final DateFormat _dateTimeFallback = DateFormat("d MMM yyyy, HH:mm");
  static final DateFormat _dateFallback = DateFormat("d MMM yyyy");

  static DateFormat get _dateTime => _dateSymbolsReady ? _dateTimeIndonesian : _dateTimeFallback;
  static DateFormat get _date => _dateSymbolsReady ? _dateIndonesian : _dateFallback;

  static String rupiah(num value) => _rupiah.format(value);

  static String dateTime(String? iso) {
    if (iso == null || iso.isEmpty) return "-";
    final parsed = DateTime.tryParse(iso);
    return parsed == null ? "-" : _dateTime.format(parsed.toLocal());
  }

  static String date(String? iso) {
    if (iso == null || iso.isEmpty) return "-";
    final parsed = DateTime.tryParse(iso);
    return parsed == null ? "-" : _date.format(parsed.toLocal());
  }
}

import "package:intl/intl.dart";

class Format {
  const Format._();

  static final NumberFormat _rupiah = NumberFormat.currency(
    locale: "id_ID",
    symbol: "Rp",
    decimalDigits: 0,
  );

  static final DateFormat _dateTime = DateFormat("d MMM yyyy, HH:mm", "id_ID");
  static final DateFormat _date = DateFormat("d MMM yyyy", "id_ID");

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

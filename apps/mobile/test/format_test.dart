import "package:flutter_test/flutter_test.dart";

import "package:laundryos_mobile/src/domain/format.dart";

void main() {
  group("Format.rupiah", () {
    test("memakai titik ribuan dan tanpa desimal", () {
      expect(Format.rupiah(0), "Rp0");
      expect(Format.rupiah(30000), "Rp30.000");
      expect(Format.rupiah(1234567), "Rp1.234.567");
    });
  });

  group("Format tanggal sebelum initialize", () {
    // Kasus nyata: layar dirender sebelum bootstrap selesai (atau di widget
    // test yang tidak memanggil Format.initialize). Dulu ini melempar
    // LocaleDataException dan menggantikan isi kartu dengan ErrorWidget.
    test("tidak melempar dan tetap menghasilkan tanggal", () {
      final formatted = Format.dateTime("2026-09-15T10:00:00Z");

      expect(formatted, isNotEmpty);
      expect(formatted, isNot("-"));
      expect(formatted, matches(RegExp(r"^\d{1,2} \w+ \d{4}, \d{2}:\d{2}$")));
    });

    test("nilai kosong atau tidak valid menjadi tanda hubung", () {
      expect(Format.dateTime(null), "-");
      expect(Format.dateTime(""), "-");
      expect(Format.dateTime("bukan-tanggal"), "-");
      expect(Format.date("bukan-tanggal"), "-");
    });
  });

  group("Format tanggal setelah initialize", () {
    setUpAll(Format.initialize);

    test("memakai nama bulan locale Indonesia", () {
      expect(Format.dateTime("2026-09-15T10:00:00Z"), contains("Sep"));
      expect(Format.date("2026-09-15T10:00:00Z"),
          matches(RegExp(r"^\d{1,2} \w+ \d{4}$")));
    });
  });
}

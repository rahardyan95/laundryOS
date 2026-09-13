import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:laundryos_mobile/src/screens/login_screen.dart";

void main() {
  testWidgets("LoginScreen menampilkan email, kata sandi, dan tombol masuk", (tester) async {
    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.widgetWithText(FilledButton, "Masuk"), findsOneWidget);
    expect(find.text("Masuk ke akun staf"), findsOneWidget);
  });
}

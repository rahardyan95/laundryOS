import "package:flutter/material.dart";
import "package:flutter_test/flutter_test.dart";
import "package:provider/provider.dart";

import "package:laundryos_mobile/src/app_dependencies.dart";
import "package:laundryos_mobile/src/screens/login_screen.dart";
import "package:laundryos_mobile/src/state/auth_controller.dart";
import "package:laundryos_mobile/src/state/order_controller.dart";

import "support/fake_transport.dart";
import "support/in_memory_session_store.dart";

void main() {
  testWidgets("LoginScreen menampilkan email, kata sandi, dan tombol masuk", (tester) async {
    final deps = AppDependencies(
      transport: FakeTransport(),
      store: InMemorySessionStore(),
    );

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthController>.value(value: deps.authController),
          ChangeNotifierProvider<OrderController>.value(value: deps.orderController),
        ],
        child: const MaterialApp(home: LoginScreen()),
      ),
    );

    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.widgetWithText(FilledButton, "Masuk"), findsOneWidget);
    expect(find.text("Masuk ke akun staf"), findsOneWidget);
  });
}

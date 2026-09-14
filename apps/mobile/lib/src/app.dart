import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "app_dependencies.dart";
import "state/auth_controller.dart";
import "screens/home_shell.dart";
import "screens/login_screen.dart";
import "theme/app_theme.dart";

class LaundryOsApp extends StatefulWidget {
  const LaundryOsApp({super.key, required this.dependencies});

  final AppDependencies dependencies;

  @override
  State<LaundryOsApp> createState() => _LaundryOsAppState();
}

class _LaundryOsAppState extends State<LaundryOsApp> {
  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  /// Pulihkan sesi lebih dulu, baru sinkronkan: antrean hanya boleh dikirim
  /// dengan identitas yang sudah diketahui.
  Future<void> _bootstrap() async {
    await widget.dependencies.authController.bootstrap();
    await widget.dependencies.syncController.start();
  }

  @override
  Widget build(BuildContext context) {
    final deps = widget.dependencies;
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: deps.authController),
        ChangeNotifierProvider.value(value: deps.orderController),
        ChangeNotifierProvider.value(value: deps.deliveryTaskController),
        ChangeNotifierProvider.value(value: deps.catalogController),
        ChangeNotifierProvider.value(value: deps.notificationController),
        ChangeNotifierProvider.value(value: deps.dashboardController),
        ChangeNotifierProvider.value(value: deps.connectivityController),
        ChangeNotifierProvider.value(value: deps.syncController),
      ],
      child: MaterialApp(
        title: "LaundryOS",
        debugShowCheckedModeBanner: false,
        // Dua mode dari satu palet; mode mengikuti pengaturan sistem karena
        // pengguna Android sudah punya kebiasaan itu dan satu sakelar lagi
        // hanya menambah langkah.
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: ThemeMode.system,
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final status =
        context.select<AuthController, AuthStatus>((auth) => auth.status);

    return switch (status) {
      AuthStatus.unknown =>
        const Scaffold(body: Center(child: CircularProgressIndicator())),
      AuthStatus.authenticated => const HomeShell(),
      AuthStatus.unauthenticated => const LoginScreen(),
    };
  }
}

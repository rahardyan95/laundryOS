import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "app_dependencies.dart";
import "state/auth_controller.dart";
import "screens/home_screen.dart";
import "screens/login_screen.dart";

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
    widget.dependencies.authController.bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: widget.dependencies.authController),
        ChangeNotifierProvider.value(value: widget.dependencies.orderController),
      ],
      child: MaterialApp(
        title: "LaundryOS",
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F5C4A)),
        ),
        home: const AuthGate(),
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final status = context.select<AuthController, AuthStatus>((auth) => auth.status);

    return switch (status) {
      AuthStatus.unknown => const Scaffold(body: Center(child: CircularProgressIndicator())),
      AuthStatus.authenticated => const HomeScreen(),
      AuthStatus.unauthenticated => const LoginScreen(),
    };
  }
}

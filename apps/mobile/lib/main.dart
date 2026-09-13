import "package:flutter/material.dart";

import "src/api/session_manager.dart";
import "src/screens/home_screen.dart";
import "src/screens/login_screen.dart";

void main() => runApp(const LaundryOsApp());

class LaundryOsApp extends StatelessWidget {
  const LaundryOsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "LaundryOS",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1F5C4A)),
      ),
      home: FutureBuilder<bool>(
        future: SessionManager.instance.isLoggedIn,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
          }
          return snapshot.data! ? const HomeScreen() : const LoginScreen();
        },
      ),
    );
  }
}

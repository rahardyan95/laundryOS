import "package:flutter/material.dart";

import "logout_button.dart";

/// Kerangka layar untuk halaman di dalam sesi: judul, aksi opsional, dan
/// tombol keluar.
///
/// Setiap layar butuh ketiganya dengan susunan yang sama, jadi susunannya
/// ditulis sekali di sini. Layar cukup mengisi judul dan isinya.
class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.title,
    required this.body,
    this.actions = const [],
    this.floatingActionButton,
    this.showLogout = true,
  });

  final String title;
  final Widget body;
  final List<Widget> actions;
  final Widget? floatingActionButton;
  final bool showLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...actions,
          if (showLogout) const LogoutButton(),
        ],
      ),
      floatingActionButton: floatingActionButton,
      body: body,
    );
  }
}

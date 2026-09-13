import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../state/auth_controller.dart";

class LogoutButton extends StatelessWidget {
  const LogoutButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () => context.read<AuthController>().logout(),
      icon: const Icon(Icons.logout),
      tooltip: "Keluar",
    );
  }
}

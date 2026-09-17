import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../state/auth_controller.dart";
import "../theme/app_metrics.dart";
import "../widgets/brand_lockup.dart";
import "../widgets/error_notice.dart";
import "../widgets/surface_card.dart";

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: "owner@laundryos.test");
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    await context
        .read<AuthController>()
        .login(_email.text.trim(), _password.text);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final busy = auth.busy;
    final error = auth.error;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Fokus tunggal layar ini: identitas, bukan formulir.
                  const BrandLockup(subtitle: "Masuk ke akun staf"),
                  const SizedBox(height: AppSpacing.xxl),
                  SurfaceCard(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          autofillHints: const [AutofillHints.username],
                          decoration: const InputDecoration(labelText: "Email"),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        TextField(
                          controller: _password,
                          obscureText: true,
                          autofillHints: const [AutofillHints.password],
                          onSubmitted: (_) => busy ? null : _submit(),
                          decoration:
                              const InputDecoration(labelText: "Kata sandi"),
                        ),
                        if (error != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          ErrorNotice(message: error),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                        FilledButton(
                          onPressed: busy ? null : _submit,
                          child: busy
                              ? const SizedBox(
                                  height: AppLoaderSizes.button,
                                  width: AppLoaderSizes.button,
                                  child: CircularProgressIndicator(
                                      strokeWidth: AppLoaderSizes.stroke),
                                )
                              : const Text("Masuk"),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

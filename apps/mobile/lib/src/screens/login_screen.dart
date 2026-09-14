import "package:flutter/material.dart";
import "package:provider/provider.dart";

import "../api/api_exception.dart";
import "../state/auth_controller.dart";
import "../theme/app_metrics.dart";
import "../widgets/brand_mark.dart";
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
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context
          .read<AuthController>()
          .login(_email.text.trim(), _password.text);
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } on NetworkException catch (error) {
      setState(() => _error = error.message);
    } catch (_) {
      setState(() => _error = "Tidak dapat masuk. Coba lagi.");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                          onSubmitted: (_) => _loading ? null : _submit(),
                          decoration:
                              const InputDecoration(labelText: "Kata sandi"),
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: AppSpacing.md),
                          ErrorNotice(message: _error!),
                        ],
                        const SizedBox(height: AppSpacing.lg),
                        FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
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

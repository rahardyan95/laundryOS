import "package:flutter/material.dart";
import "package:sentry_flutter/sentry_flutter.dart";

import "src/app.dart";
import "src/app_dependencies.dart";

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final dependencies = AppDependencies();

  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment("SENTRY_DSN");
      options.tracesSampleRate = 0.1;
      options.environment = const String.fromEnvironment("APP_ENV", defaultValue: "dev");
    },
    appRunner: () => runApp(LaundryOsApp(dependencies: dependencies)),
  );
}

import "package:flutter/material.dart";

import "src/app.dart";
import "src/app_dependencies.dart";

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(LaundryOsApp(dependencies: AppDependencies()));
}

import "package:flutter/material.dart";

import "app_metrics.dart";
import "app_palette.dart";
import "app_status_tones.dart";
import "app_typography.dart";

/// Tema aplikasi: satu tempat yang merangkai palet, tipografi, bentuk, dan
/// tone status menjadi `ThemeData`. Layar tidak boleh menulis warna atau
/// radius sendiri (antislop R-31: tiap keputusan visual punya satu sumber).
///
/// Dua mode, keduanya dirakit dari palet yang sama. Mode default mengikuti
/// sistem: outlet memakai terang, kurir malam memakai gelap. Tidak ada sakelar
/// tema di dalam aplikasi karena pengaturan sistem sudah menjadi kebiasaan
/// pengguna Android dan satu sakelar lagi hanya menambah langkah.
class AppTheme {
  const AppTheme._();

  static ThemeData light() =>
      _build(scheme: _lightScheme, tones: StatusTones.light);

  static ThemeData dark() =>
      _build(scheme: _darkScheme, tones: StatusTones.dark);

  static const ColorScheme _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppPalette.pine,
    onPrimary: AppPalette.onPine,
    primaryContainer: AppPalette.pineSoft,
    onPrimaryContainer: AppPalette.onPineSoft,
    secondary: Color(0xFF44615A),
    onSecondary: AppPalette.onPine,
    secondaryContainer: AppPalette.pineGrey,
    onSecondaryContainer: AppPalette.ink,
    tertiary: AppPalette.lime,
    onTertiary: AppPalette.onLime,
    tertiaryContainer: Color(0xFFEAF7D0),
    onTertiaryContainer: Color(0xFF243D14),
    error: AppPalette.error,
    onError: AppPalette.onPine,
    errorContainer: AppPalette.errorContainer,
    onErrorContainer: AppPalette.onErrorContainer,
    surface: AppPalette.paper,
    onSurface: AppPalette.ink,
    onSurfaceVariant: AppPalette.muted,
    surfaceContainerLowest: AppPalette.surfaceLight,
    surfaceContainerLow: Color(0xFFFAF9F5),
    surfaceContainer: Color(0xFFF2F1EB),
    surfaceContainerHigh: AppPalette.pineGrey,
    surfaceContainerHighest: Color(0xFFE7EDEA),
    outline: AppPalette.outlineLight,
    outlineVariant: Color(0xFFE7EDEA),
    shadow: Color(0x1A152420),
    scrim: Color(0x80000000),
    inverseSurface: AppPalette.ink,
    onInverseSurface: AppPalette.paper,
    inversePrimary: AppPalette.lime,
  );

  static const ColorScheme _darkScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: AppPalette.pineBright,
    onPrimary: AppPalette.onPineBright,
    primaryContainer: AppPalette.pineSoftDark,
    onPrimaryContainer: AppPalette.onPineSoftDark,
    secondary: Color(0xFF9CB8B0),
    onSecondary: AppPalette.onPineBright,
    secondaryContainer: AppPalette.nightSurfaceAlt,
    onSecondaryContainer: AppPalette.inkDark,
    tertiary: AppPalette.limeBright,
    onTertiary: Color(0xFF16250C),
    tertiaryContainer: Color(0xFF2A3A17),
    onTertiaryContainer: Color(0xFFE3F5C4),
    error: AppPalette.errorDark,
    onError: Color(0xFF3A1717),
    errorContainer: AppPalette.errorContainerDark,
    onErrorContainer: AppPalette.onErrorContainerDark,
    surface: AppPalette.night,
    onSurface: AppPalette.inkDark,
    onSurfaceVariant: AppPalette.mutedDark,
    surfaceContainerLowest: Color(0xFF0B1210),
    surfaceContainerLow: AppPalette.nightSurface,
    surfaceContainer: AppPalette.nightSurfaceAlt,
    surfaceContainerHigh: Color(0xFF243030),
    surfaceContainerHighest: Color(0xFF2C3936),
    outline: AppPalette.outlineDark,
    outlineVariant: Color(0xFF243030),
    shadow: Color(0x66000000),
    scrim: Color(0x99000000),
    inverseSurface: AppPalette.inkDark,
    onInverseSurface: AppPalette.night,
    inversePrimary: AppPalette.onPine,
  );

  static ThemeData _build(
      {required ColorScheme scheme, required StatusTones tones}) {
    final textTheme =
        AppTypography.textTheme(scheme.onSurface, scheme.onSurfaceVariant);
    final isDark = scheme.brightness == Brightness.dark;
    const buttonShape =
        RoundedRectangleBorder(borderRadius: AppRadii.fieldBorder);

    return ThemeData(
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.surface,
      textTheme: textTheme,
      extensions: <ThemeExtension<dynamic>>[tones],

      // Kartu memakai garis tepi, bukan bayangan: hierarki dari batas, bukan
      // dari ketinggian. Hanya elemen yang benar-benar melayang (FAB) punya elevasi.
      cardTheme: CardThemeData(
        color: isDark ? AppPalette.nightSurface : AppPalette.surfaceLight,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.cardBorder,
          side: BorderSide(color: scheme.outlineVariant),
        ),
      ),

      appBarTheme: AppBarThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
        iconTheme: IconThemeData(color: scheme.onSurfaceVariant, size: 22),
        actionsIconTheme:
            IconThemeData(color: scheme.onSurfaceVariant, size: 22),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        // Satu-satunya aksen limau di aplikasi: penanda tujuan yang sedang dibuka.
        indicatorColor: isDark ? AppPalette.limeBright : AppPalette.lime,
        indicatorShape:
            const RoundedRectangleBorder(borderRadius: AppRadii.chipBorder),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 22,
            color: states.contains(WidgetState.selected)
                ? AppPalette.onLime
                : scheme.onSurfaceVariant,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => (textTheme.labelMedium ?? const TextStyle()).copyWith(
            color: states.contains(WidgetState.selected)
                ? scheme.primary
                : scheme.onSurfaceVariant,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w600,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationThemeData(
        filled: true,
        fillColor: isDark ? AppPalette.nightSurfaceAlt : AppPalette.pineGrey,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        labelStyle:
            textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
        floatingLabelStyle:
            textTheme.labelMedium?.copyWith(color: scheme.primary),
        hintStyle:
            textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
        errorStyle: textTheme.bodySmall?.copyWith(color: scheme.error),
        border: const OutlineInputBorder(
          borderRadius: AppRadii.fieldBorder,
          borderSide: BorderSide.none,
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: AppRadii.fieldBorder,
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadii.fieldBorder,
          borderSide: BorderSide(color: scheme.primary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadii.fieldBorder,
          borderSide: BorderSide(color: scheme.error, width: 1.2),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppRadii.fieldBorder,
          borderSide: BorderSide(color: scheme.error, width: 1.6),
        ),
      ),

      // Tinggi minimum 48dp: ambang sasaran sentuh Android (pro-rules).
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          shape: buttonShape,
          elevation: 0,
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(64, 48),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          shape: buttonShape,
          side: BorderSide(color: scheme.outline),
          textStyle: textTheme.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          shape: buttonShape,
          textStyle: textTheme.labelLarge,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          minimumSize: const Size(48, 48),
          foregroundColor: scheme.onSurfaceVariant,
        ),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: scheme.surfaceContainerHigh,
        surfaceTintColor: Colors.transparent,
        side: BorderSide.none,
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.chipBorder),
        labelStyle:
            textTheme.labelMedium?.copyWith(color: scheme.onSurfaceVariant),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      ),

      dividerTheme: DividerThemeData(
        color: scheme.outlineVariant,
        thickness: 1,
        space: 1,
      ),

      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        titleTextStyle: textTheme.titleMedium,
        subtitleTextStyle: textTheme.bodySmall,
        iconColor: scheme.onSurfaceVariant,
      ),

      dialogTheme: DialogThemeData(
        backgroundColor:
            isDark ? AppPalette.nightSurface : AppPalette.surfaceLight,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadii.sheet)),
        ),
      ),

      // Satu-satunya elemen ber-elevasi: benar-benar melayang di atas daftar.
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        elevation: 2,
        focusElevation: 2,
        hoverElevation: 2,
        highlightElevation: 3,
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.cardBorder),
        extendedTextStyle:
            textTheme.labelLarge?.copyWith(color: scheme.onPrimary),
      ),

      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: scheme.inverseSurface,
        contentTextStyle:
            textTheme.bodyMedium?.copyWith(color: scheme.onInverseSurface),
        actionTextColor: scheme.inversePrimary,
        elevation: 0,
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.fieldBorder),
      ),

      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: scheme.primary,
        linearTrackColor: scheme.surfaceContainerHigh,
      ),

      textSelectionTheme: TextSelectionThemeData(
        cursorColor: scheme.primary,
        selectionColor: scheme.primary.withValues(alpha: 0.22),
        selectionHandleColor: scheme.primary,
      ),

      splashColor: scheme.primary.withValues(alpha: 0.08),
      highlightColor: scheme.primary.withValues(alpha: 0.04),
      visualDensity: VisualDensity.standard,
    );
  }
}

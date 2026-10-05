import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Paleta de web/tailwind.config.ts (mismos valores hex) para que el nuevo
/// frontend tenga la misma identidad visual que el Next.js.
class AppColors {
  AppColors._();

  static const Color surface = Color(0xFF111317);
  static const Color surfaceLowest = Color(0xFF0C0E12);
  static const Color surfaceLow = Color(0xFF1A1C20);
  static const Color surfaceContainer = Color(0xFF1E2024);
  static const Color surfaceHigh = Color(0xFF282A2E);
  static const Color surfaceHighest = Color(0xFF333539);
  static const Color onSurface = Color(0xFFE2E2E8);
  static const Color onSurfaceVariant = Color(0xFFD0C5AF);
  static const Color outline = Color(0xFF99907C);
  static const Color primary = Color(0xFFF2CA50);
  static const Color onPrimary = Color(0xFF3C2F00);
  static const Color primaryContainer = Color(0xFFD4AF37);
  static const Color onPrimaryContainer = Color(0xFF554300);
  static const Color secondary = Color(0xFFFABC4D);
  static const Color error = Color(0xFFFFB4AB);
  static const Color errorContainer = Color(0xFF93000A);
  static const Color onErrorContainer = Color(0xFFFFDAD6);
  static const Color success = Color(0xFF10B981);
}

/// Fuentes de la marca. `useGoogleFonts` se apaga en las pruebas de widgets para
/// no descargar fuentes por red (google_fonts lanza error si no puede cargarlas).
class AppFonts {
  AppFonts._();

  static bool useGoogleFonts = true;

  static TextStyle mono({Color? color, double? fontSize}) => useGoogleFonts
      ? GoogleFonts.jetBrainsMono(color: color, fontSize: fontSize)
      : TextStyle(color: color, fontSize: fontSize, fontFamily: 'monospace');
}

class AppTheme {
  AppTheme._();

  static ThemeData dark() {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.dark);

    final scheme = ColorScheme.dark().copyWith(
      primary: AppColors.primary,
      onPrimary: AppColors.onPrimary,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.onPrimaryContainer,
      secondary: AppColors.secondary,
      error: AppColors.error,
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.onErrorContainer,
      surface: AppColors.surface,
      onSurface: AppColors.onSurface,
      onSurfaceVariant: AppColors.onSurfaceVariant,
      outline: AppColors.outline,
      surfaceContainerLowest: AppColors.surfaceLowest,
      surfaceContainerLow: AppColors.surfaceLow,
      surfaceContainer: AppColors.surfaceContainer,
      surfaceContainerHigh: AppColors.surfaceHigh,
      surfaceContainerHighest: AppColors.surfaceHighest,
    );

    final outfit = AppFonts.useGoogleFonts
        ? GoogleFonts.outfitTextTheme(base.textTheme)
        : base.textTheme;
    final hanken = AppFonts.useGoogleFonts
        ? GoogleFonts.hankenGroteskTextTheme(base.textTheme)
        : base.textTheme;

    final textTheme = hanken
        .copyWith(
          displayLarge: outfit.displayLarge?.copyWith(fontSize: 56, fontWeight: FontWeight.w600, height: 1.15),
          headlineLarge: outfit.headlineLarge?.copyWith(fontSize: 40, fontWeight: FontWeight.w600),
          headlineMedium: outfit.headlineMedium?.copyWith(fontSize: 28, fontWeight: FontWeight.w700),
          headlineSmall: outfit.headlineSmall?.copyWith(fontSize: 22, fontWeight: FontWeight.w600),
          titleLarge: hanken.titleLarge?.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
          titleMedium: hanken.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.w600),
          titleSmall: hanken.titleSmall?.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
          bodyLarge: hanken.bodyLarge?.copyWith(fontSize: 17, height: 1.5),
          bodyMedium: hanken.bodyMedium?.copyWith(fontSize: 15, height: 1.45),
          bodySmall: hanken.bodySmall?.copyWith(fontSize: 13, height: 1.4),
          labelLarge: hanken.labelLarge?.copyWith(fontSize: 14, fontWeight: FontWeight.w600),
        )
        .apply(bodyColor: AppColors.onSurface, displayColor: AppColors.onSurface);

    return base.copyWith(
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.surface,
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surfaceLowest,
        foregroundColor: AppColors.onSurface,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceContainer,
        labelStyle: const TextStyle(color: AppColors.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.surfaceHigh),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.surfaceHigh),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? AppColors.primary : null,
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? AppColors.primaryContainer : null,
        ),
        checkColor: WidgetStateProperty.all(AppColors.onPrimaryContainer),
      ),
    );
  }
}

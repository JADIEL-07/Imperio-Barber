import 'package:flutter/foundation.dart';

/// Base de la API. En web usa el mismo origen (/api), igual que el frontend
/// Next.js, así que no hay CORS ni cookies cross-site.
///
/// En móvil (o en desarrollo local) se define con:
///   flutter run --dart-define=API_BASE_URL=https://flutter.imperio.newonline.digital/api
/// En el emulador de Android, localhost es el propio emulador: usa http://10.0.2.2:[puerto].
class Env {
  Env._();

  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;
    if (kIsWeb) return Uri.base.resolve('/api').toString();
    return 'https://flutter.imperio.newonline.digital/api';
  }

  /// Última versión del APK publicada en GitHub Releases (nombre de archivo fijo).
  static const String androidApkUrl =
      'https://github.com/JADIEL-07/Imperio-Barber/releases/latest/download/imperio-barber.apk';
}

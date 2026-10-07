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

  static const String _release = 'https://github.com/JADIEL-07/Imperio-Barber/releases/latest/download';

  /// Última versión publicada en GitHub Releases (nombres de archivo fijos).
  static const String androidApkUrl = '$_release/imperio-barber.apk';

  /// IPA sin firmar: se instala con AltStore/Sideloadly.
  static const String iosIpaUrl = '$_release/imperio-barber-unsigned.ipa';
  static const String windowsSetupUrl = '$_release/imperio-barber-setup.exe';
  static const String windowsZipUrl = '$_release/imperio-barber-windows.zip';
  static const String linuxDebUrl = '$_release/imperio-barber.deb';
  static const String linuxAppImageUrl = '$_release/imperio-barber.AppImage';
}

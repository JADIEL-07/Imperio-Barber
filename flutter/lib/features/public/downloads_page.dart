import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/env.dart';
import '../../core/theme.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';

/// Misma información que web/src/app/(public)/descargas/page.tsx.
class DownloadsPage extends StatelessWidget {
  const DownloadsPage({super.key});

  static const _targets = <_Target>[
    _Target(
      platform: 'Android',
      icon: Icons.android,
      files: [_File('Descargar APK', Env.androidApkUrl)],
      steps: [
        'Abre el archivo descargado desde tu teléfono.',
        'Si Android lo pide, permite instalar apps de esta fuente.',
      ],
    ),
    _Target(
      platform: 'iPhone / iPad',
      icon: Icons.phone_iphone,
      files: [_File('Descargar IPA', Env.iosIpaUrl)],
      steps: [
        'El archivo no está firmado por Apple: instálalo con AltStore o Sideloadly usando tu Apple ID.',
        'La instalación gratuita caduca a los 7 días y hay que renovarla.',
      ],
    ),
    _Target(
      platform: 'Windows',
      icon: Icons.desktop_windows,
      files: [
        _File('Instalador (.exe)', Env.windowsSetupUrl),
        _File('Versión portable (.zip)', Env.windowsZipUrl),
      ],
      steps: [
        'Ejecuta el instalador. Si aparece "Windows protegió su equipo", pulsa Más información y luego Ejecutar de todos modos.',
        'No necesita permisos de administrador.',
      ],
    ),
    _Target(
      platform: 'Linux',
      icon: Icons.terminal,
      files: [
        _File('Paquete .deb (Debian/Ubuntu)', Env.linuxDebUrl),
        _File('AppImage (cualquier distro)', Env.linuxAppImageUrl),
      ],
      steps: [
        '.deb: sudo apt install ./imperio-barber.deb',
        'AppImage: chmod +x imperio-barber.AppImage y ejecútalo.',
      ],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Aplicación', title: 'Descargar la app'),
        const SizedBox(height: 8),
        Text(
          'Reserva y gestiona tus citas desde tu dispositivo. Elige tu plataforma.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [for (final t in _targets) _TargetCard(target: t)],
        ),
      ],
    );
  }
}

class _File {
  const _File(this.label, this.url);
  final String label;
  final String url;
}

class _Target {
  const _Target({required this.platform, required this.icon, required this.files, required this.steps});
  final String platform;
  final IconData icon;
  final List<_File> files;
  final List<String> steps;
}

class _TargetCard extends StatelessWidget {
  const _TargetCard({required this.target});

  final _Target target;

  @override
  Widget build(BuildContext context) {
    final muted = const TextStyle(color: AppColors.onSurfaceVariant, height: 1.5, fontSize: 13);
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 280, maxWidth: 620),
      child: Panel(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(children: [
              Icon(target.icon, color: AppColors.primary, size: 28),
              const SizedBox(width: 10),
              Flexible(
                child: Text(target.platform, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              ),
            ]),
            const SizedBox(height: 14),
            Wrap(spacing: 10, runSpacing: 10, children: [
              for (final f in target.files)
                OutlinedButton.icon(
                  onPressed: () => launchUrl(Uri.parse(f.url), webOnlyWindowName: '_self'),
                  icon: const Icon(Icons.download, size: 18),
                  label: Text(f.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
            ]),
            const SizedBox(height: 14),
            for (final s in target.steps)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('•  ', style: muted),
                  Expanded(child: Text(s, style: muted)),
                ]),
              ),
          ],
        ),
      ),
    );
  }
}

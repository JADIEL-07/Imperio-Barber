import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Marca de Imperio Barber: la misma estrella de 8 puntas que LogoMark en web.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 24, this.color = AppColors.primary});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) =>
      CustomPaint(size: Size.square(size), painter: _LogoPainter(color));
}

class _LogoPainter extends CustomPainter {
  _LogoPainter(this.color);

  final Color color;

  static final Path _path = Path()
    ..moveTo(20, 5)
    ..lineTo(24, 14)
    ..lineTo(33, 11)
    ..lineTo(29, 22)
    ..lineTo(36, 30)
    ..lineTo(25, 31)
    ..lineTo(20, 40)
    ..lineTo(15, 31)
    ..lineTo(4, 30)
    ..lineTo(11, 22)
    ..lineTo(7, 11)
    ..lineTo(16, 14)
    ..close();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 40, size.height / 40);
    canvas.drawPath(_path, Paint()..color = color);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LogoPainter oldDelegate) => oldDelegate.color != color;
}

/// Botón principal con degradado dorado (bg-gradient-to-r from-primary-container to-secondary).
class GoldButton extends StatelessWidget {
  const GoldButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Opacity(
      opacity: enabled ? 1 : 0.4,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primaryContainer, AppColors.secondary],
          ),
          borderRadius: BorderRadius.circular(8),
          boxShadow: enabled
              ? [BoxShadow(color: AppColors.primaryContainer.withValues(alpha: 0.35), blurRadius: 14)]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: const TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.w700),
                  ),
                  if (icon != null) ...[
                    const SizedBox(width: 8),
                    Icon(icon, size: 18, color: AppColors.onPrimary),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Tarjeta de superficie con borde sutil (rounded-xl border border-surface-container-high).
class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color = AppColors.surfaceLow,
    this.borderColor = AppColors.surfaceHigh,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Color borderColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: borderColor),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

/// Etiqueta pequeña en mayúsculas (estado de cita, "Ahorras", "Activo", etc.).
class Tag extends StatelessWidget {
  const Tag(
    this.text, {
    super.key,
    this.color = AppColors.surfaceHigh,
    this.textColor = AppColors.onSurfaceVariant,
    this.icon,
  });

  final String text;
  final Color color;
  final Color textColor;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textColor),
            const SizedBox(width: 4),
          ],
          // Flexible: en pantallas estrechas el texto se corta en vez de desbordar la fila.
          Flexible(
            child: Text(
              text.toUpperCase(),
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Mensaje de error (o de éxito si isError es false) dentro de la página.
class MessageBanner extends StatelessWidget {
  const MessageBanner(this.message, {super.key, this.isError = true});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? AppColors.errorContainer : AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: isError ? AppColors.onErrorContainer : AppColors.primary,
        ),
      ),
    );
  }
}

/// Encabezado de página: etiqueta en mayúsculas dorada + título grande.
class PageTitle extends StatelessWidget {
  const PageTitle({super.key, required this.eyebrow, required this.title, this.icon});

  final String eyebrow;
  final String title;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 4),
            ],
            Text(
              eyebrow.toUpperCase(),
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 2.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
      ],
    );
  }
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.label = 'Cargando...'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(color: AppColors.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    this.message = 'Ocurrió un error al cargar la información.',
    this.onRetry,
  });

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Panel(
      color: AppColors.errorContainer.withValues(alpha: 0.1),
      borderColor: AppColors.error.withValues(alpha: 0.3),
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 36),
          const SizedBox(height: 8),
          Text(message, textAlign: TextAlign.center),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            TextButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ],
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, this.icon = Icons.inbox, required this.title, this.description});

  final IconData icon;
  final String title;
  final String? description;

  @override
  Widget build(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
      child: Column(
        children: [
          Icon(icon, color: AppColors.onSurfaceVariant, size: 36),
          const SizedBox(height: 8),
          Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
          if (description != null) ...[
            const SizedBox(height: 4),
            Text(
              description!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}

/// Carga un Future y muestra loading / error (con reintento) / contenido.
/// Al cambiar el Future (recarga), mantiene el último dato visible.
class AsyncContent<T> extends StatelessWidget {
  const AsyncContent({
    super.key,
    required this.future,
    required this.onRetry,
    required this.builder,
    this.loadingLabel = 'Cargando...',
  });

  final Future<T> future;
  final VoidCallback onRetry;
  final Widget Function(T data) builder;
  final String loadingLabel;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return ErrorView(onRetry: onRetry);
        }
        if (!snapshot.hasData) {
          return LoadingView(label: loadingLabel);
        }
        return builder(snapshot.requireData);
      },
    );
  }
}

/// "09:30" -> TimeOfDay(09, 30). Así llegan los horarios desde la API.
TimeOfDay parseHm(String hm) {
  final parts = hm.split(':');
  return TimeOfDay(hour: int.tryParse(parts[0]) ?? 8, minute: int.tryParse(parts[1]) ?? 0);
}

/// TimeOfDay -> "09:30", el formato que espera la API.
String formatHm(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

/// Cuadrícula responsiva simple: columnas fijas y tarjetas del mismo ancho.
class Grid extends StatelessWidget {
  const Grid({super.key, required this.columns, required this.children, this.spacing = 16});

  final int columns;
  final List<Widget> children;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = (constraints.maxWidth - spacing * (columns - 1)) / columns;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final child in children) SizedBox(width: itemWidth, child: child),
          ],
        );
      },
    );
  }
}

/// 1 columna en móvil, 2 en tablet y `desktop` columnas en escritorio.
int columnsFor(BuildContext context, {int desktop = 4}) {
  final width = MediaQuery.sizeOf(context).width;
  if (width < 600) return 1;
  if (width < 1024) return 2;
  return desktop;
}

/// Margen horizontal de página (px-margin en móvil, px-margin-tablet/desktop en pantallas grandes).
double pageMargin(BuildContext context) => MediaQuery.sizeOf(context).width < 600 ? 16 : 32;

/// Tarjeta con imagen opcional de URL (si falla la carga, no muestra nada).
class NetworkImageBox extends StatelessWidget {
  const NetworkImageBox({super.key, required this.url, this.height = 120});

  final String url;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Image.network(
        url,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => const ColoredBox(color: AppColors.surfaceHigh),
      ),
    );
  }
}

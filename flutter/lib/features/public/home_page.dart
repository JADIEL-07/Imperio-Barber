import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';
import 'cards.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late Future<({List<Service> services, List<Combo> combos})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<Service> services, List<Combo> combos})> _load() async {
    final api = context.read<AppServices>();
    final services = await api.services();
    final combos = await api.combos();
    return (services: services.take(4).toList(), combos: combos.take(2).toList());
  }

  void _reload() => setState(() { _future = _load(); });

  @override
  Widget build(BuildContext context) {
    final margin = pageMargin(context);
    final textTheme = Theme.of(context).textTheme;
    final isNarrow = MediaQuery.sizeOf(context).width < 600;

    return SingleChildScrollView(
      child: Column(
        children: [
          _Hero(textTheme: textTheme, isNarrow: isNarrow),
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1600),
              child: Padding(
                padding: EdgeInsets.fromLTRB(margin, 32, margin, 8),
                child: AsyncContent<({List<Service> services, List<Combo> combos})>(
                  future: _future,
                  onRetry: _reload,
                  builder: (data) => Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _SectionHeader(
                        eyebrow: 'Carta',
                        title: 'Servicios destacados',
                        linkLabel: 'Ver todos',
                        onLink: () => context.go('/servicios'),
                      ),
                      const SizedBox(height: 16),
                      if (data.services.isEmpty)
                        const EmptyView(icon: Icons.content_cut, title: 'Aún no hay servicios publicados')
                      else
                        Grid(
                          columns: columnsFor(context),
                          children: [for (final s in data.services) ServiceCard(service: s)],
                        ),
                      const SizedBox(height: 40),
                      _SectionHeader(
                        eyebrow: 'Rituales',
                        title: 'Combos exclusivos',
                        linkLabel: 'Ver todos',
                        onLink: () => context.go('/combos'),
                      ),
                      const SizedBox(height: 16),
                      if (data.combos.isEmpty)
                        const EmptyView(icon: Icons.local_offer, title: 'Aún no hay combos publicados')
                      else
                        Grid(
                          columns: columnsFor(context, desktop: 2),
                          children: [for (final c in data.combos) ComboCard(combo: c)],
                        ),
                      const SizedBox(height: 40),
                      const _LocationCard(),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const AppFooter(),
        ],
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.textTheme, required this.isNarrow});

  final TextTheme textTheme;
  final bool isNarrow;

  @override
  Widget build(BuildContext context) {
    final margin = pageMargin(context);
    return Stack(
      children: [
        Positioned.fill(
          child: Image.network(
            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=70',
            fit: BoxFit.cover,
            color: Colors.black.withValues(alpha: 0.6),
            colorBlendMode: BlendMode.darken,
            errorBuilder: (_, _, _) => const ColoredBox(color: AppColors.surfaceLowest),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  AppColors.surfaceLowest,
                  AppColors.surfaceLowest.withValues(alpha: 0.85),
                  AppColors.surfaceLowest.withValues(alpha: 0.4),
                ],
              ),
            ),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [AppColors.surface, AppColors.surface.withValues(alpha: 0)],
              ),
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(margin, isNarrow ? 48 : 96, margin, isNarrow ? 56 : 96),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  const Flexible(
                    child: Text(
                      'ATELIER DE BARBERÍA • BOGOTÁ CHICÓ NORTE',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.2,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                'Precisión de autor en cada corte.',
                style: textTheme.displayLarge?.copyWith(
                  fontSize: isNarrow ? 36 : 56,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Text(
                  'Reserva en minutos con nuestros maestros de la navaja. Rituales de afeitado, cortes de precisión y una experiencia pensada para el hombre moderno.',
                  style: textTheme.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
                ),
              ),
              const SizedBox(height: 28),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  GoldButton(
                    label: 'Reservar Cita',
                    icon: Icons.arrow_forward,
                    onPressed: () => context.go('/reservar'),
                  ),
                  OutlinedButton(
                    onPressed: () => context.go('/servicios'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.onSurface,
                      backgroundColor: AppColors.surfaceHigh,
                      side: BorderSide.none,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                    child: const Text('Ver Servicios', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                  DownloadAppButton(onPressed: () => context.go('/descargas')),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.eyebrow,
    required this.title,
    required this.linkLabel,
    required this.onLink,
  });

  final String eyebrow;
  final String title;
  final String linkLabel;
  final VoidCallback onLink;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: PageTitle(eyebrow: eyebrow, title: title)),
        TextButton(onPressed: onLink, child: Text(linkLabel)),
      ],
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard();

  @override
  Widget build(BuildContext context) {
    final muted = const TextStyle(color: AppColors.onSurfaceVariant, height: 1.6);
    return Panel(
      padding: const EdgeInsets.all(24),
      child: Wrap(
        spacing: 48,
        runSpacing: 24,
        children: [
          SizedBox(
            width: 300,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Sede Chicó Norte', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on, size: 18, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Expanded(child: Text('Calle 94 # 11A - 28, Chicó Norte, Bogotá D.C.', style: muted)),
                  ],
                ),
                Row(
                  children: [
                    const Icon(Icons.call, size: 18, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text('+57 (601) 745-9820', style: muted),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(
            width: 300,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Horario de Atención', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 8),
                Text('Lunes a Viernes: 08:00 AM – 09:00 PM', style: muted),
                Text('Sábados: 08:00 AM – 08:00 PM', style: muted),
                Text('Domingos y Festivos: 10:00 AM – 06:00 PM', style: muted),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

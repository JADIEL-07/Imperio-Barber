import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';
import 'cards.dart';

class ServicesPage extends StatefulWidget {
  const ServicesPage({super.key});

  @override
  State<ServicesPage> createState() => _ServicesPageState();
}

class _ServicesPageState extends State<ServicesPage> {
  late Future<List<Service>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().services();
  }

  void _reload() => setState(() => _future = context.read<AppServices>().services());

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        PageTitle(eyebrow: 'Carta completa', title: 'Servicios'),
        const SizedBox(height: 8),
        Text(
          'Cada ritual incluye diagnóstico capilar y acabado con productos de alta cosmética masculina. Precios en pesos colombianos.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        AsyncContent<List<Service>>(
          future: _future,
          onRetry: _reload,
          builder: (services) => services.isEmpty
              ? const EmptyView(
                  icon: Icons.content_cut,
                  title: 'Aún no hay servicios publicados',
                  description: 'Vuelve pronto, estamos actualizando la carta.',
                )
              : Grid(
                  columns: columnsFor(context, desktop: 3),
                  children: [for (final s in services) ServiceCard(service: s, imageHeight: 160)],
                ),
        ),
        const SizedBox(height: 32),
        Center(
          child: GoldButton(
            label: 'Reservar Cita',
            icon: Icons.arrow_forward,
            onPressed: () => context.go('/reservar'),
          ),
        ),
      ],
    );
  }
}

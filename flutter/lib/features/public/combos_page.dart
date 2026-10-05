import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';
import 'cards.dart';

class CombosPage extends StatefulWidget {
  const CombosPage({super.key});

  @override
  State<CombosPage> createState() => _CombosPageState();
}

class _CombosPageState extends State<CombosPage> {
  late Future<List<Combo>> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().combos();
  }

  void _reload() => setState(() => _future = context.read<AppServices>().combos());

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        PageTitle(eyebrow: 'Experiencias', title: 'Combos'),
        const SizedBox(height: 8),
        Text(
          'Rituales completos que combinan varios servicios con un precio preferencial frente a reservarlos por separado.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 24),
        AsyncContent<List<Combo>>(
          future: _future,
          onRetry: _reload,
          builder: (combos) => combos.isEmpty
              ? const EmptyView(icon: Icons.local_offer, title: 'Aún no hay combos publicados')
              : Grid(
                  columns: columnsFor(context, desktop: 2),
                  children: [for (final c in combos) ComboCard(combo: c)],
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

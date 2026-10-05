import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/admin_nav.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';

/// Dashboard del administrador (web/src/app/(admin)/admin/page.tsx).
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  late Future<Stats> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().stats();
  }

  void _reload() => setState(() => _future = context.read<AppServices>().stats());

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      maxWidth: 1600,
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Dashboard'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 24),
        AsyncContent<Stats>(
          future: _future,
          onRetry: _reload,
          builder: (stats) => _buildStats(context, stats),
        ),
      ],
    );
  }

  Widget _buildStats(BuildContext context, Stats stats) {
    final textTheme = Theme.of(context).textTheme;
    final labelStyle = textTheme.labelMedium?.copyWith(color: AppColors.onSurfaceVariant, letterSpacing: 0.5);
    final valueStyle = textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Grid(
          columns: columnsFor(context),
          children: [
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CITAS DE HOY', style: labelStyle),
                  const SizedBox(height: 4),
                  Text('${stats.todayAppointments}', style: valueStyle),
                ],
              ),
            ),
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('INGRESOS DEL MES', style: labelStyle),
                  const SizedBox(height: 4),
                  Text(formatCop(stats.monthRevenue), style: valueStyle?.copyWith(color: AppColors.primary)),
                ],
              ),
            ),
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('FONDO DE COMISIONES PAGADAS', style: labelStyle),
                  const SizedBox(height: 4),
                  Text(formatCop(stats.totalCommissionsPaid), style: valueStyle),
                ],
              ),
            ),
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('CITAS POR ESTADO (HOY)', style: labelStyle),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final entry in stats.statusCounts.entries)
                        Tag('${statusLabel(entry.key)}: ${entry.value}', textColor: AppColors.onSurface),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Grid(
          columns: columnsFor(context, desktop: 2),
          spacing: 16,
          children: [
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Ingresos por día (mes en curso)', style: textTheme.titleMedium),
                  const SizedBox(height: 16),
                  if (stats.revenueByDay.isEmpty)
                    const EmptyView(icon: Icons.trending_up, title: 'Aún no hay ingresos registrados este mes')
                  else
                    _RevenueBars(data: stats.revenueByDay),
                ],
              ),
            ),
            Panel(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Ingresos por servicio', style: textTheme.titleMedium),
                  const SizedBox(height: 16),
                  if (stats.revenueByService.isEmpty)
                    const EmptyView(icon: Icons.content_cut, title: 'Aún no hay suficientes datos')
                  else
                    _ServiceRevenue(items: stats.revenueByService),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Servicios más pedidos (mes)', style: textTheme.titleMedium),
              const SizedBox(height: 12),
              if (stats.topServices.isEmpty)
                const EmptyView(icon: Icons.trending_up, title: 'Aún no hay suficientes datos')
              else
                for (final s in stats.topServices)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Expanded(child: Text(s.name)),
                        Text('${s.value}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Barras verticales de ingresos por día (RevenueByDayChart.tsx), un solo tono dorado.
class _RevenueBars extends StatelessWidget {
  const _RevenueBars({required this.data});

  final List<DatedValue> data;

  @override
  Widget build(BuildContext context) {
    final max = data.fold<int>(1, (m, d) => math.max(m, d.total));
    final first = DateTime.parse(data.first.date);
    final last = DateTime.parse(data.last.date);

    return Column(
      children: [
        SizedBox(
          height: 160,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              for (final d in data)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 1),
                    child: Tooltip(
                      message: '${fmtDate(DateTime.parse(d.date))}: ${formatCop(d.total)}',
                      child: Container(
                        height: math.max(2.0, d.total / max * 160),
                        decoration: const BoxDecoration(
                          color: AppColors.primaryContainer,
                          borderRadius: BorderRadius.vertical(top: Radius.circular(3)),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(fmtDate(first), style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
            const Spacer(),
            Text(fmtDate(last), style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
          ],
        ),
      ],
    );
  }
}

class _ServiceRevenue extends StatelessWidget {
  const _ServiceRevenue({required this.items});

  final List<NamedValue> items;

  @override
  Widget build(BuildContext context) {
    final max = items.fold<int>(1, (m, s) => math.max(m, s.value));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final s in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(s.name)),
                    Text(
                      formatCop(s.value),
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: math.max(0.04, s.value / max),
                    minHeight: 8,
                    color: AppColors.primaryContainer,
                    backgroundColor: AppColors.surfaceHigh,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

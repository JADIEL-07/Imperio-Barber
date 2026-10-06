import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';

/// Mi Agenda del barbero (web/src/app/(empleado)/empleado/agenda/page.tsx).
class AgendaPage extends StatefulWidget {
  const AgendaPage({super.key});

  @override
  State<AgendaPage> createState() => _AgendaPageState();
}

class _AgendaPageState extends State<AgendaPage> {
  bool _weekView = false;
  DateTime _anchor = bogotaToday();
  late Future<List<Appointment>> _future;
  String? _actionError;
  String? _busyId;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  ({DateTime from, DateTime to}) get _range {
    if (!_weekView) return (from: _anchor, to: _anchor);
    final monday = _anchor.subtract(Duration(days: _anchor.weekday - DateTime.monday));
    return (from: monday, to: monday.add(const Duration(days: 6)));
  }

  Future<List<Appointment>> _load() async {
    final range = _range;
    final page = await context.read<AppServices>().appointments(
          scope: 'barber',
          from: isoDate(range.from),
          to: isoDate(range.to),
          pageSize: 100,
        );
    return page.items..sort((a, b) => DateTime.parse(a.start).compareTo(DateTime.parse(b.start)));
  }

  void _refresh() => setState(() { _future = _load(); });

  void _shift(int days) {
    setState(() {
      _anchor = _anchor.add(Duration(days: days));
      _future = _load();
    });
  }

  Future<void> _run(Appointment appt, Future<Appointment> Function() action, String errorMessage) async {
    setState(() {
      _busyId = appt.id;
      _actionError = null;
    });
    try {
      await action();
      _refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    } catch (_) {
      if (mounted) setState(() => _actionError = errorMessage);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = context.read<AppServices>();
    final range = _range;
    final rangeLabel = _weekView ? '${isoDate(range.from)} — ${isoDate(range.to)}' : fmtDate(_anchor);

    return ContentScroll(
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 12,
          runSpacing: 12,
          children: [
            const PageTitle(eyebrow: 'Panel barbero', title: 'Mi Agenda'),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Día')),
                ButtonSegment(value: true, label: Text('Semana')),
              ],
              selected: {_weekView},
              onSelectionChanged: (s) {
                setState(() {
                  _weekView = s.first;
                  _future = _load();
                });
              },
            ),
          ],
        ),
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                tooltip: 'Anterior',
                onPressed: () => _shift(_weekView ? -7 : -1),
                icon: const Icon(Icons.chevron_left),
              ),
              Expanded(
                child: Text(rangeLabel, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleSmall),
              ),
              IconButton(
                tooltip: 'Siguiente',
                onPressed: () => _shift(_weekView ? 7 : 1),
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (_actionError != null) ...[
          MessageBanner(_actionError!),
          const SizedBox(height: 12),
        ],
        AsyncContent<List<Appointment>>(
          future: _future,
          onRetry: _refresh,
          builder: (appointments) {
            if (appointments.isEmpty) {
              return const EmptyView(icon: Icons.event_busy, title: 'No tienes citas en este rango de fechas');
            }
            final groups = <String, List<Appointment>>{};
            for (final a in appointments) {
              groups.putIfAbsent(isoDate(toBogota(a.start)), () => []).add(a);
            }
            final keys = groups.keys.toList()..sort();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final day in keys) ...[
                  if (_weekView) ...[
                    Text(
                      fmtDate(toBogota(groups[day]!.first.start)).toUpperCase(),
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.onSurfaceVariant),
                    ),
                    const SizedBox(height: 8),
                  ],
                  for (final appt in groups[day]!) ...[
                    _AgendaCard(
                      appointment: appt,
                      busy: _busyId == appt.id,
                      onCheckIn: () => _run(appt, () => api.checkIn(appt.id), 'No pudimos registrar el check-in.'),
                      onStatus: (status) => _run(
                        appt,
                        () => api.updateAppointment(appt.id, status: status),
                        'No pudimos actualizar la cita.',
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                  const SizedBox(height: 8),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

Color _badgeColor(String status) {
  switch (status) {
    case 'pending':
      return AppColors.secondary.withValues(alpha: 0.2);
    case 'confirmed':
      return AppColors.primary.withValues(alpha: 0.2);
    case 'completed':
      return AppColors.surfaceHigh;
    default:
      return AppColors.errorContainer.withValues(alpha: 0.4);
  }
}

class _AgendaCard extends StatelessWidget {
  const _AgendaCard({
    required this.appointment,
    required this.busy,
    required this.onCheckIn,
    required this.onStatus,
  });

  final Appointment appointment;
  final bool busy;
  final VoidCallback onCheckIn;
  final ValueChanged<String> onStatus;

  @override
  Widget build(BuildContext context) {
    final appt = appointment;
    final start = toBogota(appt.start);
    final end = toBogota(appt.end);
    final muted = Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant);

    return Panel(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Tag(statusLabel(appt.status), color: _badgeColor(appt.status), textColor: AppColors.onSurface),
              if (appt.checkedInAt != null)
                const Tag('Llegó', color: Color(0x3310B981), textColor: AppColors.success, icon: Icons.check_circle),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.schedule, size: 14, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(fmtTimeRange(start, end)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(appt.title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('${appt.clientName} • ${appt.clientPhone}  ·  ${formatCop(appt.totalPrice)}', style: muted),
          if (appt.isOpen) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (appt.checkedInAt == null)
                  _ActionChip(
                    label: 'Check-in',
                    color: AppColors.success,
                    onPressed: busy ? null : onCheckIn,
                  ),
                _ActionChip(label: 'Completada', onPressed: busy ? null : () => onStatus('completed')),
                _ActionChip(label: 'No asistió', onPressed: busy ? null : () => onStatus('no_show')),
                _ActionChip(
                  label: 'Cancelar',
                  color: AppColors.error,
                  onPressed: busy ? null : () => onStatus('cancelled'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.label, required this.onPressed, this.color = AppColors.onSurface});

  final String label;
  final VoidCallback? onPressed;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        visualDensity: VisualDensity.compact,
        side: BorderSide(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(label),
    );
  }
}

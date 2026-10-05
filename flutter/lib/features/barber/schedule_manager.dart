import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../ui/dialogs.dart';
import '../../ui/widgets.dart';

class _DayRow {
  _DayRow({this.enabled = false, this.start = '08:00', this.end = '20:00'});

  bool enabled;
  String start;
  String end;
}

/// Horario semanal + bloqueos de un barbero (ScheduleManager.tsx).
/// Lo usa el propio barbero (/empleado/disponibilidad) y el admin (/admin/empleados).
class ScheduleManager extends StatefulWidget {
  const ScheduleManager({super.key, required this.barberId});

  final String barberId;

  @override
  State<ScheduleManager> createState() => _ScheduleManagerState();
}

class _ScheduleManagerState extends State<ScheduleManager> {
  bool _loading = true;
  String? _loadError;
  final List<_DayRow> _week = List.generate(7, (_) => _DayRow());
  List<TimeOff> _timeOffs = [];

  bool _savingSchedule = false;
  String? _scheduleMessage;
  String? _scheduleError;

  final _reason = TextEditingController();
  DateTime? _from;
  DateTime? _to;
  bool _savingTimeOff = false;
  String? _timeOffError;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant ScheduleManager oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.barberId != widget.barberId) _load();
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final api = context.read<AppServices>();
      final schedule = await api.schedule(widget.barberId);
      final offs = await api.timeOffs(widget.barberId);
      if (!mounted) return;
      for (final day in _week) {
        day
          ..enabled = false
          ..start = '08:00'
          ..end = '20:00';
      }
      for (final s in schedule) {
        _week[s.weekday]
          ..enabled = true
          ..start = s.start
          ..end = s.end;
      }
      setState(() => _timeOffs = offs);
    } catch (_) {
      if (mounted) setState(() => _loadError = 'No pudimos cargar el horario del barbero.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveSchedule() async {
    setState(() {
      _savingSchedule = true;
      _scheduleMessage = null;
      _scheduleError = null;
    });
    try {
      final payload = <Schedule>[
        for (var i = 0; i < _week.length; i++)
          if (_week[i].enabled)
            Schedule(weekday: i, start: _week[i].start, end: _week[i].end),
      ];
      await context.read<AppServices>().saveSchedule(widget.barberId, payload);
      if (mounted) setState(() => _scheduleMessage = 'Horario actualizado correctamente.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _scheduleError = e.message);
    } catch (_) {
      if (mounted) setState(() => _scheduleError = 'No pudimos guardar el horario.');
    } finally {
      if (mounted) setState(() => _savingSchedule = false);
    }
  }

  Future<void> _pickTime(_DayRow row, bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: parseHm(isStart ? row.start : row.end),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        row.start = formatHm(picked);
      } else {
        row.end = formatHm(picked);
      }
    });
  }

  Future<void> _pickDate({required bool isFrom}) async {
    final today = bogotaToday();
    final picked = await showDatePicker(
      context: context,
      initialDate: (isFrom ? _from : _to) ?? today,
      firstDate: today.subtract(const Duration(days: 365)),
      lastDate: today.add(const Duration(days: 730)),
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _from = picked;
      } else {
        _to = picked;
      }
    });
  }

  Future<void> _addTimeOff() async {
    final from = _from;
    final to = _to;
    if (from == null || to == null || _reason.text.trim().isEmpty) {
      setState(() => _timeOffError = 'Completa fecha de inicio, fin y motivo.');
      return;
    }
    setState(() {
      _savingTimeOff = true;
      _timeOffError = null;
    });
    try {
      final created = await context.read<AppServices>().addTimeOff(
            widget.barberId,
            from: DateTime.utc(from.year, from.month, from.day).toIso8601String(),
            to: DateTime.utc(to.year, to.month, to.day).toIso8601String(),
            reason: _reason.text.trim(),
          );
      if (!mounted) return;
      setState(() {
        _timeOffs = [..._timeOffs, created];
        _from = null;
        _to = null;
        _reason.clear();
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _timeOffError = e.message);
    } finally {
      if (mounted) setState(() => _savingTimeOff = false);
    }
  }

  Future<void> _deleteTimeOff(TimeOff t) async {
    final ok = await confirmDialog(
      context,
      title: 'Eliminar bloqueo',
      message: '¿Eliminar este bloqueo de agenda?',
      confirmLabel: 'Eliminar',
      destructive: true,
    );
    if (!ok || !mounted) return;
    try {
      await context.read<AppServices>().deleteTimeOff(widget.barberId, t.id);
      if (mounted) setState(() => _timeOffs = _timeOffs.where((x) => x.id != t.id).toList());
    } on ApiException catch (e) {
      if (mounted) setState(() => _timeOffError = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView(label: 'Cargando horario...');
    if (_loadError != null) return ErrorView(message: _loadError!, onRetry: _load);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Panel(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Horario semanal', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (_scheduleError != null) ...[
                MessageBanner(_scheduleError!),
                const SizedBox(height: 12),
              ],
              if (_scheduleMessage != null) ...[
                MessageBanner(_scheduleMessage!, isError: false),
                const SizedBox(height: 12),
              ],
              for (var i = 0; i < _week.length; i++) _buildDayRow(i),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: GoldButton(
                  label: _savingSchedule ? 'Guardando...' : 'Guardar horario',
                  onPressed: _savingSchedule ? null : _saveSchedule,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Bloqueos y vacaciones', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              if (_timeOffError != null) ...[
                MessageBanner(_timeOffError!),
                const SizedBox(height: 12),
              ],
              if (_timeOffs.isEmpty)
                const EmptyView(icon: Icons.event_busy, title: 'No hay bloqueos registrados')
              else
                for (final t in _timeOffs)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.reason, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text(
                                '${fmtDate(DateTime.parse(t.from))} — ${fmtDate(DateTime.parse(t.to))}',
                                style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: 'Eliminar bloqueo',
                          onPressed: () => _deleteTimeOff(t),
                          icon: const Icon(Icons.delete_outline, size: 18),
                        ),
                      ],
                    ),
                  ),
              const Divider(height: 28, color: AppColors.surfaceHigh),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                crossAxisAlignment: WrapCrossAlignment.end,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _pickDate(isFrom: true),
                    icon: const Icon(Icons.calendar_month, size: 18),
                    label: Text(_from == null ? 'Desde' : fmtDate(_from!)),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _pickDate(isFrom: false),
                    icon: const Icon(Icons.calendar_month, size: 18),
                    label: Text(_to == null ? 'Hasta' : fmtDate(_to!)),
                  ),
                  SizedBox(
                    width: 240,
                    child: TextField(
                      controller: _reason,
                      decoration: const InputDecoration(
                        labelText: 'Motivo',
                        hintText: 'Vacaciones, permiso médico...',
                      ),
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primaryContainer,
                      foregroundColor: AppColors.onPrimaryContainer,
                    ),
                    onPressed: _savingTimeOff ? null : _addTimeOff,
                    child: const Text('Agregar'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDayRow(int index) {
    final row = _week[index];
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        runSpacing: 8,
        children: [
          SizedBox(
            width: 150,
            child: CheckboxListTile(
              value: row.enabled,
              dense: true,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(weekdayLabel(index)),
              onChanged: (v) => setState(() => row.enabled = v ?? false),
            ),
          ),
          OutlinedButton(
            onPressed: row.enabled ? () => _pickTime(row, true) : null,
            child: Text(row.start),
          ),
          const Text('—', style: TextStyle(color: AppColors.onSurfaceVariant)),
          OutlinedButton(
            onPressed: row.enabled ? () => _pickTime(row, false) : null,
            child: Text(row.end),
          ),
        ],
      ),
    );
  }
}

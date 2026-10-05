import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../ui/dialogs.dart';
import '../../ui/widgets.dart';

/// Reprogramar cita (RescheduleAppointmentModal.tsx). Devuelve la cita actualizada o null.
Future<Appointment?> showRescheduleDialog(BuildContext context, Appointment appointment) {
  return showDialog<Appointment>(
    context: context,
    builder: (_) => RescheduleDialog(appointment: appointment),
  );
}

class RescheduleDialog extends StatefulWidget {
  const RescheduleDialog({super.key, required this.appointment});

  final Appointment appointment;

  @override
  State<RescheduleDialog> createState() => _RescheduleDialogState();
}

class _RescheduleDialogState extends State<RescheduleDialog> {
  late DateTime _date;
  List<Slot> _slots = [];
  bool _loading = false;
  Slot? _selected;
  String? _error;
  bool _submitting = false;

  /// Misma duración que la cita original (mínimo 15 minutos).
  int get _durationMinutes {
    final start = DateTime.parse(widget.appointment.start);
    final end = DateTime.parse(widget.appointment.end);
    final minutes = end.difference(start).inMinutes;
    return minutes < 15 ? 15 : minutes;
  }

  @override
  void initState() {
    super.initState();
    final day = toBogota(widget.appointment.start);
    _date = DateTime(day.year, day.month, day.day);
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() {
      _loading = true;
      _error = null;
      _selected = null;
    });
    try {
      final slots = await context.read<AppServices>().availability(
            date: isoDate(_date),
            barberId: widget.appointment.barberId,
            durationMinutes: _durationMinutes,
          );
      if (mounted) setState(() => _slots = slots);
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'No pudimos cargar los turnos disponibles para esa fecha.';
          _slots = [];
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final today = bogotaToday();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date.isBefore(today) ? today : _date,
      firstDate: today,
      lastDate: today.add(const Duration(days: 180)),
    );
    if (picked == null) return;
    setState(() => _date = picked);
    _loadSlots();
  }

  Future<void> _confirm() async {
    final slot = _selected;
    if (slot == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final updated = await context.read<AppServices>().updateAppointment(
            widget.appointment.id,
            start: slot.start,
          );
      if (mounted) Navigator.of(context).pop(updated);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        setState(() => _error = 'Esa franja se acaba de ocupar por otro cliente. Elige otra.');
        _loadSlots();
      } else {
        setState(() => _error = e.message);
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'No pudimos reprogramar la cita.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormDialog(
      title: 'Reprogramar cita',
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primaryContainer,
            foregroundColor: AppColors.onPrimaryContainer,
          ),
          onPressed: _selected == null || _submitting ? null : _confirm,
          child: Text(_submitting ? 'Guardando...' : 'Confirmar nuevo horario'),
        ),
      ],
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_error != null) ...[
            MessageBanner(_error!),
            const SizedBox(height: 12),
          ],
          const Text('Nueva fecha', style: TextStyle(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_month, size: 18),
              label: Text(fmtDate(_date)),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Turnos disponibles', style: TextStyle(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 6),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Cargando turnos...'),
            )
          else if (_slots.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('No hay turnos disponibles ese día.'),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final slot in _slots)
                  ChoiceChip(
                    label: Text(fmtTime(toBogota(slot.start))),
                    selected: _selected?.start == slot.start,
                    selectedColor: AppColors.primaryContainer,
                    labelStyle: TextStyle(
                      color: _selected?.start == slot.start ? AppColors.onPrimaryContainer : AppColors.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (_) => setState(() => _selected = slot),
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

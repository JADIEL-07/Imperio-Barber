import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/admin_nav.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';

const List<String> _statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

/// Todas las citas con filtros (web/src/app/(admin)/admin/citas/page.tsx).
class AppointmentsAdminPage extends StatefulWidget {
  const AppointmentsAdminPage({super.key});

  @override
  State<AppointmentsAdminPage> createState() => _AppointmentsAdminPageState();
}

class _AppointmentsAdminPageState extends State<AppointmentsAdminPage> {
  final _clientFilter = TextEditingController();
  String _status = '';
  String _barberFilter = '';
  DateTime? _from;
  DateTime? _to;
  String? _actionError;
  String? _busyId;
  late Future<({List<Appointment> items, List<Barber> barbers})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _clientFilter.dispose();
    super.dispose();
  }

  Future<({List<Appointment> items, List<Barber> barbers})> _load() async {
    final api = context.read<AppServices>();
    final page = await api.appointments(
      scope: 'all',
      status: _status,
      from: _from == null ? null : isoDate(_from!),
      to: _to == null ? null : isoDate(_to!),
      pageSize: 200,
    );
    final barbers = await api.barbers();
    return (items: page.items, barbers: barbers);
  }

  void _refresh() => setState(() => _future = _load());

  Future<void> _pickDate({required bool isFrom}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: (isFrom ? _from : _to) ?? bogotaToday(),
      firstDate: DateTime(2024),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _from = picked;
      } else {
        _to = picked;
      }
    });
    _refresh();
  }

  Future<void> _changeStatus(Appointment appt, String status) async {
    setState(() {
      _busyId = appt.id;
      _actionError = null;
    });
    try {
      await context.read<AppServices>().updateAppointment(appt.id, status: status);
      _refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  List<Appointment> _applyLocalFilters(List<Appointment> all) {
    final q = _clientFilter.text.trim().toLowerCase();
    return all.where((a) {
      if (_barberFilter.isNotEmpty && a.barberId != _barberFilter) return false;
      if (q.isNotEmpty && !a.clientName.toLowerCase().contains(q) && !a.clientPhone.contains(q)) {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Todas las Citas'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        AsyncContent<({List<Appointment> items, List<Barber> barbers})>(
          future: _future,
          onRetry: _refresh,
          builder: (data) {
            final visible = _applyLocalFilters(data.items);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildFilters(data.barbers),
                const SizedBox(height: 16),
                if (_actionError != null) ...[
                  MessageBanner(_actionError!),
                  const SizedBox(height: 12),
                ],
                if (visible.isEmpty)
                  const EmptyView(icon: Icons.event_busy, title: 'No hay citas que coincidan con los filtros')
                else
                  for (final appt in visible) ...[
                    _AppointmentRow(
                      appointment: appt,
                      busy: _busyId == appt.id,
                      onStatus: (s) => _changeStatus(appt, s),
                    ),
                    const SizedBox(height: 10),
                  ],
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildFilters(List<Barber> barbers) {
    return Panel(
      padding: const EdgeInsets.all(12),
      child: Wrap(
        spacing: 12,
        runSpacing: 12,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          DropdownButton<String>(
            value: _status,
            items: [
              const DropdownMenuItem(value: '', child: Text('Todos los estados')),
              for (final s in _statuses) DropdownMenuItem(value: s, child: Text(statusLabel(s))),
            ],
            onChanged: (v) {
              _status = v ?? '';
              _refresh();
            },
          ),
          DropdownButton<String>(
            value: _barberFilter,
            items: [
              const DropdownMenuItem(value: '', child: Text('Todos los barberos')),
              for (final b in barbers) DropdownMenuItem(value: b.id, child: Text(b.name)),
            ],
            onChanged: (v) => setState(() => _barberFilter = v ?? ''),
          ),
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
          if (_from != null || _to != null)
            TextButton(
              onPressed: () {
                _from = null;
                _to = null;
                _refresh();
              },
              child: const Text('Limpiar fechas'),
            ),
          SizedBox(
            width: 220,
            child: TextField(
              controller: _clientFilter,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(hintText: 'Buscar cliente...', isDense: true),
            ),
          ),
        ],
      ),
    );
  }
}

class _AppointmentRow extends StatelessWidget {
  const _AppointmentRow({required this.appointment, required this.busy, required this.onStatus});

  final Appointment appointment;
  final bool busy;
  final ValueChanged<String> onStatus;

  @override
  Widget build(BuildContext context) {
    final appt = appointment;
    final start = toBogota(appt.start);
    final end = toBogota(appt.end);
    final muted = const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13);

    return Panel(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Tag(statusLabel(appt.status), textColor: AppColors.onSurface),
                    if (appt.checkedInAt != null)
                      const Tag('Check-in', color: Color(0x3310B981), textColor: AppColors.success, icon: Icons.check_circle),
                    Text(fmtDate(start), style: muted),
                    Text(fmtTimeRange(start, end), style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(appt.title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 14,
                  runSpacing: 4,
                  children: [
                    Text('${appt.clientName} (${appt.clientPhone})', style: muted),
                    Text(appt.barberName, style: muted),
                    Text(formatCop(appt.totalPrice), style: muted),
                    if (appt.commissionAmount != null)
                      Text(
                        'Comisión ${formatCop(appt.commissionAmount!)} ${appt.commissionPaid ? '(pagada)' : '(pendiente)'}',
                        style: muted,
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          DropdownButton<String>(
            value: appt.status,
            onChanged: busy
                ? null
                : (v) {
                    if (v != null) onStatus(v);
                  },
            items: [
              for (final s in _statuses) DropdownMenuItem(value: s, child: Text(statusLabel(s))),
            ],
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/admin_nav.dart';
import '../../shell/app_shell.dart';
import '../../ui/dialogs.dart';
import '../../ui/widgets.dart';
import '../barber/schedule_manager.dart';

/// Empleados / barberos (web/src/app/(admin)/admin/empleados/page.tsx).
class BarbersPage extends StatefulWidget {
  const BarbersPage({super.key});

  @override
  State<BarbersPage> createState() => _BarbersPageState();
}

class _BarbersPageState extends State<BarbersPage> {
  late Future<List<Barber>> _future;
  String? _expandedId;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().barbers();
  }

  void _refresh() => setState(() => _future = context.read<AppServices>().barbers());

  Future<void> _editPhoto(Barber barber) async {
    await showDialog<void>(context: context, builder: (_) => _PhotoDialog(barber: barber));
    _refresh();
  }

  Future<void> _editCommission(Barber barber) async {
    await showDialog<void>(context: context, builder: (_) => _CommissionDialog(barber: barber));
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Empleados'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        AsyncContent<List<Barber>>(
          future: _future,
          onRetry: _refresh,
          builder: (barbers) {
            if (barbers.isEmpty) {
              return const EmptyView(
                icon: Icons.badge,
                title: 'No hay barberos registrados',
                description: 'Crea usuarios con rol Empleado en la sección Usuarios.',
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final b in barbers) ...[
                  Panel(
                    padding: EdgeInsets.zero,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(14),
                          child: _BarberHeader(
                            barber: b,
                            expanded: _expandedId == b.id,
                            onPhoto: () => _editPhoto(b),
                            onCommission: () => _editCommission(b),
                            onToggleSchedule: () => setState(
                              () => _expandedId = _expandedId == b.id ? null : b.id,
                            ),
                          ),
                        ),
                        if (_expandedId == b.id)
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: const BoxDecoration(
                              color: AppColors.surfaceContainer,
                              border: Border(top: BorderSide(color: AppColors.surfaceHigh)),
                            ),
                            child: ScheduleManager(barberId: b.id),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _BarberHeader extends StatelessWidget {
  const _BarberHeader({
    required this.barber,
    required this.expanded,
    required this.onPhoto,
    required this.onCommission,
    required this.onToggleSchedule,
  });

  final Barber barber;
  final bool expanded;
  final VoidCallback onPhoto;
  final VoidCallback onCommission;
  final VoidCallback onToggleSchedule;

  @override
  Widget build(BuildContext context) {
    final b = barber;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppColors.surfaceHigh,
              backgroundImage: b.imageUrl != null ? NetworkImage(b.imageUrl!) : null,
              child: b.imageUrl == null ? const Icon(Icons.person, color: AppColors.primary) : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(b.name, style: Theme.of(context).textTheme.titleMedium),
                  Wrap(
                    spacing: 12,
                    children: [
                      if (b.phone.isNotEmpty)
                        Text(b.phone, style: const TextStyle(color: AppColors.onSurfaceVariant)),
                      Text(
                        'Comisión: ${formatPercent(b.commissionRate)}',
                        style: AppFonts.mono(color: AppColors.primary, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (b.services.isEmpty)
                    const Text('Sin servicios asignados', style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12))
                  else
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        for (final s in b.services) Tag(s.name, textColor: AppColors.onSurfaceVariant),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            OutlinedButton(onPressed: onPhoto, child: const Text('Foto')),
            OutlinedButton(onPressed: onCommission, child: const Text('Comisiones')),
            FilledButton.tonal(
              onPressed: onToggleSchedule,
              child: Text(expanded ? 'Ocultar horario' : 'Gestionar horario'),
            ),
          ],
        ),
      ],
    );
  }
}

class _PhotoDialog extends StatefulWidget {
  const _PhotoDialog({required this.barber});

  final Barber barber;

  @override
  State<_PhotoDialog> createState() => _PhotoDialogState();
}

class _PhotoDialogState extends State<_PhotoDialog> {
  late final TextEditingController _url;
  String? _error;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _url = TextEditingController(text: widget.barber.imageUrl ?? '');
  }

  @override
  void dispose() {
    _url.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      await context.read<AppServices>().updateBarber(widget.barber.id, {'avatar_url': _url.text.trim()});
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final url = _url.text.trim();
    return FormDialog(
      title: 'Foto de ${widget.barber.name}',
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cancelar')),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.primaryContainer,
            foregroundColor: AppColors.onPrimaryContainer,
          ),
          onPressed: _submitting ? null : _save,
          child: Text(_submitting ? 'Guardando...' : 'Guardar'),
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
          if (url.isNotEmpty) ...[
            Center(
              child: CircleAvatar(radius: 48, backgroundImage: NetworkImage(url)),
            ),
            const SizedBox(height: 12),
          ],
          TextField(
            controller: _url,
            keyboardType: TextInputType.url,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'URL de la imagen',
              hintText: 'https://...',
              helperText: 'Pega el link de una foto ya alojada. Déjalo vacío para quitar la foto.',
            ),
          ),
        ],
      ),
    );
  }
}

class _CommissionDialog extends StatefulWidget {
  const _CommissionDialog({required this.barber});

  final Barber barber;

  @override
  State<_CommissionDialog> createState() => _CommissionDialogState();
}

class _CommissionDialogState extends State<_CommissionDialog> {
  late final TextEditingController _rate;
  late Future<CommissionSummary> _summary;
  String? _error;
  String? _message;
  bool _savingRate = false;
  bool _payingOut = false;

  @override
  void initState() {
    super.initState();
    _rate = TextEditingController(text: (widget.barber.commissionRate * 100).round().toString());
    _summary = _loadSummary();
  }

  @override
  void dispose() {
    _rate.dispose();
    super.dispose();
  }

  Future<CommissionSummary> _loadSummary() => context.read<AppServices>().commissions(widget.barber.id);

  void _reloadSummary() => setState(() => _summary = _loadSummary());

  Future<void> _saveRate() async {
    final pct = double.tryParse(_rate.text.trim());
    if (pct == null || pct < 0 || pct > 100) {
      setState(() => _error = 'La comisión debe ser un número entre 0 y 100.');
      return;
    }
    setState(() {
      _error = null;
      _message = null;
      _savingRate = true;
    });
    try {
      await context.read<AppServices>().updateBarber(widget.barber.id, {'commission_rate': pct / 100});
      if (!mounted) return;
      setState(() => _message = 'Tarifa de comisión actualizada.');
      _reloadSummary();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _savingRate = false);
    }
  }

  Future<void> _payout(CommissionSummary summary) async {
    if (summary.pendingAmount <= 0) return;
    final ok = await confirmDialog(
      context,
      title: 'Pagar comisión',
      message: '¿Pagar ${formatCop(summary.pendingAmount)} de comisión pendiente a ${widget.barber.name}?',
      confirmLabel: 'Pagar',
    );
    if (!ok || !mounted) return;
    setState(() {
      _payingOut = true;
      _error = null;
    });
    try {
      await context.read<AppServices>().payCommissions(widget.barber.id);
      if (!mounted) return;
      setState(() => _message = 'Pago de comisión registrado.');
      _reloadSummary();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _payingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return FormDialog(
      title: 'Comisiones de ${widget.barber.name}',
      width: 420,
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Cerrar'))],
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_error != null) ...[
            MessageBanner(_error!),
            const SizedBox(height: 12),
          ],
          if (_message != null) ...[
            MessageBanner(_message!, isError: false),
            const SizedBox(height: 12),
          ],
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: TextField(
                  controller: _rate,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Tarifa de comisión (%)'),
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.tonal(
                onPressed: _savingRate ? null : _saveRate,
                child: Text(_savingRate ? '...' : 'Guardar'),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Se aplica a cada cita cuando pase a estado "Completada" (el % vigente en ese momento queda fijo para esa cita).',
            style: TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
          ),
          const Divider(height: 28, color: AppColors.surfaceHighest),
          AsyncContent<CommissionSummary>(
            future: _summary,
            onRetry: _reloadSummary,
            builder: (summary) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _StatBox(
                        label: 'PENDIENTE',
                        value: formatCop(summary.pendingAmount),
                        footnote: '${summary.pendingCount} citas',
                        valueColor: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatBox(label: 'PAGADO HISTÓRICO', value: formatCop(summary.paidAmount)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                GoldButton(
                  label: _payingOut ? 'Procesando...' : 'Pagar comisión pendiente',
                  expand: true,
                  onPressed: _payingOut || summary.pendingAmount <= 0 ? null : () => _payout(summary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({required this.label, required this.value, this.footnote, this.valueColor = AppColors.onSurface});

  final String label;
  final String value;
  final String? footnote;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.onSurfaceVariant, letterSpacing: 0.8)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontWeight: FontWeight.w700, color: valueColor)),
          if (footnote != null)
            Text(footnote!, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }
}

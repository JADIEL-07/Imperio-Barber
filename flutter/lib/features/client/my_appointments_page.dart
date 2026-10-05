import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/dialogs.dart';
import '../../ui/widgets.dart';
import 'reschedule_dialog.dart';

/// Mis Citas (web/src/app/(cliente)/mis-citas/page.tsx).
class MyAppointmentsPage extends StatefulWidget {
  const MyAppointmentsPage({super.key});

  @override
  State<MyAppointmentsPage> createState() => _MyAppointmentsPageState();
}

class _MyAppointmentsPageState extends State<MyAppointmentsPage> {
  late Future<Page<Appointment>> _future;
  bool _showHistory = false;
  String? _lockAlertFor;
  String? _actionError;
  String? _checkingInId;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Page<Appointment>> _load() =>
      context.read<AppServices>().appointments(scope: 'mine', pageSize: 50);

  void _reload() => setState(() => _future = _load());

  Future<void> _cancel(Appointment appt) async {
    if (!appt.canCancel) {
      setState(() => _lockAlertFor = appt.id);
      return;
    }
    final ok = await confirmDialog(
      context,
      title: 'Cancelar cita',
      message: '¿Seguro que deseas cancelar esta cita? Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, cancelar',
      destructive: true,
    );
    if (!ok || !mounted) return;
    setState(() => _actionError = null);
    try {
      await context.read<AppServices>().updateAppointment(appt.id, status: 'cancelled');
      _reload();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    }
  }

  Future<void> _reschedule(Appointment appt) async {
    if (!appt.canCancel) {
      setState(() => _lockAlertFor = appt.id);
      return;
    }
    final updated = await showRescheduleDialog(context, appt);
    if (updated != null) _reload();
  }

  Future<void> _checkIn(Appointment appt) async {
    setState(() {
      _checkingInId = appt.id;
      _actionError = null;
    });
    try {
      await context.read<AppServices>().checkIn(appt.id);
      _reload();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    } finally {
      if (mounted) setState(() => _checkingInId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        AsyncContent<Page<Appointment>>(
          future: _future,
          onRetry: _reload,
          builder: (page) {
            final all = page.items;
            final upcoming = all.where((a) => a.isOpen).toList()
              ..sort((a, b) => DateTime.parse(a.start).compareTo(DateTime.parse(b.start)));
            final history = all.where((a) => !a.isOpen).toList()
              ..sort((a, b) => DateTime.parse(b.start).compareTo(DateTime.parse(a.start)));
            final next = upcoming.isEmpty ? null : upcoming.first;
            final wide = MediaQuery.sizeOf(context).width >= 1024;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _Header(
                  upcomingCount: upcoming.length,
                  historyCount: history.length,
                  showHistory: _showHistory,
                  onChanged: (showHistory) => setState(() => _showHistory = showHistory),
                ),
                const SizedBox(height: 20),
                if (_actionError != null) ...[
                  MessageBanner(_actionError!),
                  const SizedBox(height: 16),
                ],
                if (_showHistory)
                  _buildHistory(history)
                else if (upcoming.isEmpty)
                  const EmptyView(
                    icon: Icons.event_available,
                    title: 'No tienes citas próximas',
                    description: 'Reserva tu próxima experiencia cuando quieras.',
                  )
                else if (wide)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 2, child: _buildUpcomingList(upcoming)),
                      const SizedBox(width: 24),
                      Expanded(child: _ticketFor(next!)),
                    ],
                  )
                else
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildUpcomingList(upcoming),
                      const SizedBox(height: 24),
                      _ticketFor(next!),
                    ],
                  ),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _ticketFor(Appointment appt) {
    return AppointmentTicket(
      appointment: appt,
      checkingIn: _checkingInId == appt.id,
      onCheckIn: () => _checkIn(appt),
    );
  }

  Widget _buildUpcomingList(List<Appointment> upcoming) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final appt in upcoming) ...[
          if (_lockAlertFor == appt.id) ...[
            _CancellationAlert(onDismiss: () => setState(() => _lockAlertFor = null)),
            const SizedBox(height: 8),
          ],
          _UpcomingCard(
            appointment: appt,
            onReschedule: () => _reschedule(appt),
            onCancel: () => _cancel(appt),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }

  Widget _buildHistory(List<Appointment> history) {
    if (history.isEmpty) {
      return const EmptyView(icon: Icons.history, title: 'Aún no tienes historial de citas');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final appt in history) ...[
          Opacity(
            opacity: 0.8,
            child: Panel(
              child: Row(
                children: [
                  _DateBlock(iso: appt.start, muted: true),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Tag(statusLabel(appt.status)),
                            const SizedBox(width: 8),
                            Text('#${shortId(appt.id)}', style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(appt.title, style: Theme.of(context).textTheme.titleMedium),
                        Text(
                          'Atendido por ${appt.barberName} • ${formatCop(appt.totalPrice)}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }

}

class _Header extends StatelessWidget {
  const _Header({
    required this.upcomingCount,
    required this.historyCount,
    required this.showHistory,
    required this.onChanged,
  });

  final int upcomingCount;
  final int historyCount;
  final bool showHistory;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      runSpacing: 12,
      spacing: 12,
      children: [
        const PageTitle(eyebrow: 'Portal privado', title: 'Mis Citas', icon: Icons.history_edu),
        SegmentedButton<bool>(
          segments: [
            ButtonSegment(value: false, label: Text('Próximas ($upcomingCount)')),
            ButtonSegment(value: true, label: Text('Historial ($historyCount)')),
          ],
          selected: {showHistory},
          onSelectionChanged: (s) => onChanged(s.first),
        ),
      ],
    );
  }
}

class _DateBlock extends StatelessWidget {
  const _DateBlock({required this.iso, this.muted = false});

  final String iso;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    final date = toBogota(iso);
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: muted ? AppColors.surfaceHighest : AppColors.surfaceHigh,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            fmtDay(date),
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 18,
              color: muted ? AppColors.onSurfaceVariant : AppColors.primary,
            ),
          ),
          Text(
            fmtMonth(date),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: muted ? AppColors.onSurfaceVariant : AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _UpcomingCard extends StatelessWidget {
  const _UpcomingCard({required this.appointment, required this.onReschedule, required this.onCancel});

  final Appointment appointment;
  final VoidCallback onReschedule;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    final appt = appointment;
    final textTheme = Theme.of(context).textTheme;
    final start = toBogota(appt.start);
    final end = toBogota(appt.end);

    return Panel(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _DateBlock(iso: appt.start),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Tag(statusLabel(appt.status), color: AppColors.primary.withValues(alpha: 0.2), textColor: AppColors.primary),
                        if (appt.checkedInAt != null)
                          Tag('Check-in', color: AppColors.success.withValues(alpha: 0.2), textColor: AppColors.success, icon: Icons.check_circle),
                        Text('#${shortId(appt.id)}', style: textTheme.bodySmall),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(appt.title, style: textTheme.titleMedium),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 16,
                      runSpacing: 6,
                      children: [
                        _InfoItem(icon: Icons.schedule, text: fmtTimeRange(start, end), strong: true),
                        _InfoItem(icon: Icons.person, text: appt.barberName),
                        _InfoItem(icon: Icons.payments, text: formatCop(appt.totalPrice)),
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
            alignment: WrapAlignment.end,
            children: [
              OutlinedButton.icon(
                onPressed: onReschedule,
                icon: const Icon(Icons.calendar_month, size: 18),
                label: const Text('Reprogramar'),
              ),
              TextButton.icon(
                onPressed: onCancel,
                icon: const Icon(Icons.cancel, size: 18),
                label: const Text('Cancelar'),
                style: TextButton.styleFrom(foregroundColor: AppColors.error),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  const _InfoItem({required this.icon, required this.text, this.strong = false});

  final IconData icon;
  final String text;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            color: strong ? AppColors.onSurface : AppColors.onSurfaceVariant,
            fontWeight: strong ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ],
    );
  }
}

class _CancellationAlert extends StatelessWidget {
  const _CancellationAlert({required this.onDismiss});

  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.errorContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_clock, color: AppColors.onErrorContainer),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Cancelación Bloqueada',
                  style: TextStyle(color: AppColors.onErrorContainer, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Faltan menos de 2 horas para el servicio. Comunícate a la sede al +57 (601) 745-9820 para asistencia.',
                  style: TextStyle(color: AppColors.onErrorContainer),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onDismiss,
            icon: const Icon(Icons.close, size: 18, color: AppColors.onErrorContainer),
          ),
        ],
      ),
    );
  }
}

/// Boleto con código QR (AppointmentTicket.tsx). El QR codifica IMPERIO-CHECKIN:<id>.
class AppointmentTicket extends StatelessWidget {
  const AppointmentTicket({super.key, required this.appointment, required this.onCheckIn, required this.checkingIn});

  final Appointment appointment;
  final VoidCallback onCheckIn;
  final bool checkingIn;

  @override
  Widget build(BuildContext context) {
    final appt = appointment;
    final textTheme = Theme.of(context).textTheme;
    final start = toBogota(appt.start);
    final end = toBogota(appt.end);

    return Panel(
      padding: EdgeInsets.zero,
      borderColor: AppColors.primary.withValues(alpha: 0.3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 6,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primaryContainer, AppColors.secondary]),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  (appt.checkedInAt != null ? 'Check-in registrado' : 'Check-in habilitado').toUpperCase(),
                  style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  child: QrImageView(
                    data: 'IMPERIO-CHECKIN:${appt.id}',
                    size: 140,
                    backgroundColor: Colors.white,
                    errorCorrectionLevel: QrErrorCorrectLevel.M,
                  ),
                ),
                const SizedBox(height: 16),
                Text(appt.title, textAlign: TextAlign.center, style: textTheme.titleMedium),
                Text(appt.barberName, style: textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 12),
                Text(
                  '${fmtDateLong(start)} • ${fmtTimeRange(start, end)}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text('Boleto #${shortId(appt.id)}', style: textTheme.bodySmall),
                const SizedBox(height: 16),
                if (appt.checkedInAt != null)
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle, size: 18, color: AppColors.success),
                      SizedBox(width: 6),
                      Text('Llegada registrada', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700)),
                    ],
                  )
                else if (appt.canCheckIn)
                  GoldButton(
                    label: checkingIn ? 'Registrando...' : 'Avisar que ya llegué',
                    expand: true,
                    onPressed: checkingIn ? null : onCheckIn,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

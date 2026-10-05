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

/// Configuración del negocio (web/src/app/(admin)/admin/configuracion/page.tsx).
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  late Future<BookingSettings> _future;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().settings();
  }

  void _reload() => setState(() => _future = context.read<AppServices>().settings());

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      maxWidth: 900,
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Configuración'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        AsyncContent<BookingSettings>(
          future: _future,
          onRetry: _reload,
          builder: (settings) => _SettingsForm(initial: settings),
        ),
      ],
    );
  }
}

class _SettingsForm extends StatefulWidget {
  const _SettingsForm({required this.initial});

  final BookingSettings initial;

  @override
  State<_SettingsForm> createState() => _SettingsFormState();
}

class _SettingsFormState extends State<_SettingsForm> {
  late final List<DayHours> _hours;
  late final TextEditingController _cancelHours;
  late final TextEditingController _slotMinutes;
  String? _message;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _hours = List.generate(
      7,
      (i) => widget.initial.openingHours['$i'] ?? const DayHours(open: '08:00', close: '20:00'),
    );
    _cancelHours = TextEditingController(text: widget.initial.cancelMinHours.toString());
    _slotMinutes = TextEditingController(text: widget.initial.slotMinutes.toString());
  }

  @override
  void dispose() {
    _cancelHours.dispose();
    _slotMinutes.dispose();
    super.dispose();
  }

  Future<void> _pickTime(int weekday, bool isOpen) async {
    final current = _hours[weekday];
    final picked = await showTimePicker(
      context: context,
      initialTime: parseHm(isOpen ? current.open : current.close),
    );
    if (picked == null) return;
    setState(() {
      _hours[weekday] = isOpen
          ? current.copyWith(open: formatHm(picked))
          : current.copyWith(close: formatHm(picked));
    });
  }

  Future<void> _save() async {
    setState(() {
      _message = null;
      _error = null;
      _saving = true;
    });
    try {
      await context.read<AppServices>().saveSettings(
            BookingSettings(
              openingHours: {for (var i = 0; i < 7; i++) '$i': _hours[i]},
              cancelMinHours: int.tryParse(_cancelHours.text.trim()) ?? 0,
              slotMinutes: int.tryParse(_slotMinutes.text.trim()) ?? 15,
            ),
          );
      if (mounted) setState(() => _message = 'Configuración guardada correctamente.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'No pudimos guardar la configuración.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null) ...[
          MessageBanner(_error!),
          const SizedBox(height: 12),
        ],
        if (_message != null) ...[
          MessageBanner(_message!, isError: false),
          const SizedBox(height: 12),
        ],
        Panel(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Horario general de apertura', style: textTheme.titleMedium),
              const SizedBox(height: 12),
              for (var i = 0; i < 7; i++)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      SizedBox(width: 110, child: Text(weekdayLabel(i))),
                      OutlinedButton(onPressed: () => _pickTime(i, true), child: Text(_hours[i].open)),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10),
                        child: Text('—', style: TextStyle(color: AppColors.onSurfaceVariant)),
                      ),
                      OutlinedButton(onPressed: () => _pickTime(i, false), child: Text(_hours[i].close)),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Panel(
          padding: const EdgeInsets.all(20),
          child: Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              SizedBox(
                width: 260,
                child: TextField(
                  controller: _cancelHours,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Anticipación mínima para cancelar (horas)'),
                ),
              ),
              SizedBox(
                width: 260,
                child: TextField(
                  controller: _slotMinutes,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Duración de las franjas (minutos)'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Align(
          alignment: Alignment.centerRight,
          child: GoldButton(
            label: _saving ? 'Guardando...' : 'Guardar configuración',
            onPressed: _saving ? null : _save,
          ),
        ),
      ],
    );
  }
}

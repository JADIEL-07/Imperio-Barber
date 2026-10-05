import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../models/models.dart';
import '../../shell/app_shell.dart';
import '../../ui/widgets.dart';
import '../public/cards.dart';

enum _Mode { services, combo }

const String _anyBarber = 'any';

class _Catalog {
  const _Catalog({required this.services, required this.combos, required this.barbers});

  final List<Service> services;
  final List<Combo> combos;
  final List<Barber> barbers;
}

/// Reserva en 4 pasos (web/src/app/(cliente)/reservar/page.tsx).
class BookingPage extends StatefulWidget {
  const BookingPage({super.key});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  late Future<_Catalog> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_Catalog> _load() async {
    final api = context.read<AppServices>();
    final services = await api.services();
    final combos = await api.combos();
    final barbers = await api.barbers();
    return _Catalog(services: services, combos: combos, barbers: barbers);
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      maxWidth: 900,
      children: [
        AsyncContent<_Catalog>(
          future: _future,
          loadingLabel: 'Cargando carta y maestros disponibles...',
          onRetry: () => setState(() => _future = _load()),
          builder: (catalog) {
            if (catalog.services.isEmpty && catalog.combos.isEmpty) {
              return const EmptyView(
                icon: Icons.content_cut,
                title: 'No hay servicios disponibles para reservar en este momento.',
              );
            }
            return _BookingWizard(catalog: catalog);
          },
        ),
      ],
    );
  }
}

class _BookingWizard extends StatefulWidget {
  const _BookingWizard({required this.catalog});

  final _Catalog catalog;

  @override
  State<_BookingWizard> createState() => _BookingWizardState();
}

class _BookingWizardState extends State<_BookingWizard> {
  int _step = 1;
  _Mode _mode = _Mode.services;
  final Set<String> _serviceIds = {};
  String? _comboId;
  String _barberId = _anyBarber;
  DateTime _date = bogotaToday();
  List<Slot> _slots = [];
  bool _slotsLoading = false;
  String? _slotsError;
  Slot? _selectedSlot;
  bool _submitting = false;
  String? _submitError;
  bool _confirmed = false;

  List<Service> get _selectedServices =>
      widget.catalog.services.where((s) => _serviceIds.contains(s.id)).toList();

  Combo? get _selectedCombo {
    for (final c in widget.catalog.combos) {
      if (c.id == _comboId) return c;
    }
    return null;
  }

  int get _totalDuration => _mode == _Mode.combo
      ? (_selectedCombo?.durationMinutes ?? 0)
      : _selectedServices.fold<int>(0, (sum, s) => sum + s.durationMinutes);

  int get _totalPrice => _mode == _Mode.combo
      ? (_selectedCombo?.price ?? 0)
      : _selectedServices.fold<int>(0, (sum, s) => sum + s.price);

  bool get _hasSelection => _mode == _Mode.combo ? _selectedCombo != null : _selectedServices.isNotEmpty;

  String get _barberName {
    if (_barberId == _anyBarber) return 'Cualquiera disponible';
    for (final b in widget.catalog.barbers) {
      if (b.id == _barberId) return b.name;
    }
    return '';
  }

  void _toggleService(String id) {
    setState(() {
      if (!_serviceIds.remove(id)) _serviceIds.add(id);
    });
  }

  void _goTo(int step) {
    setState(() {
      _step = step;
      _submitError = null;
    });
    if (step == 3) _loadSlots();
  }

  Future<void> _loadSlots() async {
    if (!_hasSelection || _totalDuration <= 0) return;
    setState(() {
      _slotsLoading = true;
      _slotsError = null;
      _selectedSlot = null;
    });
    try {
      final slots = await context.read<AppServices>().availability(
            date: isoDate(_date),
            barberId: _barberId == _anyBarber ? null : _barberId,
            serviceIds: _mode == _Mode.services ? _serviceIds.toList() : null,
            comboId: _mode == _Mode.combo ? _comboId : null,
            durationMinutes: _totalDuration,
          );
      if (mounted) setState(() => _slots = slots);
    } catch (_) {
      if (mounted) {
        setState(() {
          _slotsError = 'No pudimos cargar los turnos disponibles.';
          _slots = [];
        });
      }
    } finally {
      if (mounted) setState(() => _slotsLoading = false);
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
    final slot = _selectedSlot;
    if (slot == null) return;
    setState(() {
      _submitting = true;
      _submitError = null;
    });
    try {
      await context.read<AppServices>().createAppointment(
            barberId: _barberId == _anyBarber ? null : _barberId,
            start: slot.start,
            serviceIds: _mode == _Mode.services ? _serviceIds.toList() : null,
            comboId: _mode == _Mode.combo ? _comboId : null,
          );
      if (mounted) setState(() => _confirmed = true);
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        setState(() {
          _submitError = 'Esa franja se acaba de ocupar por otro cliente. Elige otra.';
          _step = 3;
        });
        await _loadSlots();
      } else {
        setState(() => _submitError = e.message);
      }
    } catch (_) {
      if (mounted) setState(() => _submitError = 'No pudimos confirmar tu cita. Intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_confirmed) return _buildConfirmed(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        PageTitle(eyebrow: 'Reserva en línea', title: 'Reserva tu experiencia'),
        const SizedBox(height: 20),
        _StepBar(step: _step, onStepTap: (s) => _goTo(s)),
        const SizedBox(height: 24),
        if (_step == 1) _buildServicesStep(),
        if (_step == 2) _buildBarberStep(),
        if (_step == 3) _buildDateStep(),
        if (_step == 4 && _selectedSlot != null) _buildSummaryStep(),
      ],
    );
  }

  Widget _buildServicesStep() {
    final catalog = widget.catalog;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedButton<_Mode>(
          segments: const [
            ButtonSegment(value: _Mode.services, label: Text('Servicios individuales')),
            ButtonSegment(value: _Mode.combo, label: Text('Combos')),
          ],
          selected: {_mode},
          onSelectionChanged: (s) => setState(() => _mode = s.first),
        ),
        const SizedBox(height: 16),
        if (_mode == _Mode.services)
          Grid(
            columns: columnsFor(context, desktop: 2),
            children: [
              for (final s in catalog.services)
                ServiceCard(
                  service: s,
                  selected: _serviceIds.contains(s.id),
                  onTap: () => _toggleService(s.id),
                  leading: Checkbox(
                    value: _serviceIds.contains(s.id),
                    onChanged: (_) => _toggleService(s.id),
                  ),
                ),
            ],
          )
        else if (catalog.combos.isEmpty)
          const EmptyView(icon: Icons.local_offer, title: 'No hay combos disponibles')
        else
          Grid(
            columns: columnsFor(context, desktop: 2),
            children: [
              for (final c in catalog.combos)
                ComboCard(
                  combo: c,
                  selected: _comboId == c.id,
                  onTap: () => setState(() => _comboId = c.id),
                  leading: Icon(
                    _comboId == c.id ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    color: AppColors.primary,
                  ),
                ),
            ],
          ),
        const SizedBox(height: 24),
        Align(
          alignment: Alignment.centerRight,
          child: GoldButton(
            label: 'Continuar a Selección de Barbero',
            icon: Icons.arrow_forward,
            onPressed: _hasSelection ? () => _goTo(2) : null,
          ),
        ),
      ],
    );
  }

  Widget _buildBarberStep() {
    final options = <({String id, String name, String? imageUrl, String detail})>[
      (
        id: _anyBarber,
        name: 'Cualquiera disponible',
        imageUrl: null,
        detail: 'Próxima butaca libre, sin tiempos de espera extra.',
      ),
      for (final b in widget.catalog.barbers)
        (id: b.id, name: b.name, imageUrl: b.imageUrl, detail: 'Especialista en barbería de autor'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Grid(
          columns: columnsFor(context, desktop: 2),
          children: [
            for (final b in options)
              Panel(
                onTap: () => setState(() => _barberId = b.id),
                color: _barberId == b.id ? AppColors.surfaceContainer : AppColors.surfaceLow,
                borderColor: _barberId == b.id ? AppColors.primary : Colors.transparent,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppColors.surfaceHighest,
                      backgroundImage: b.imageUrl != null ? NetworkImage(b.imageUrl!) : null,
                      child: b.imageUrl == null
                          ? Icon(
                              b.id == _anyBarber ? Icons.bolt : Icons.person,
                              color: AppColors.primary,
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.name, style: Theme.of(context).textTheme.titleMedium),
                          Text(
                            b.detail,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            TextButton.icon(
              onPressed: () => _goTo(1),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Regresar'),
            ),
            const Spacer(),
            GoldButton(
              label: 'Continuar a Calendario',
              icon: Icons.arrow_forward,
              onPressed: () => _goTo(3),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDateStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_submitError != null) ...[
          MessageBanner(_submitError!),
          const SizedBox(height: 16),
        ],
        Text('Fecha', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.calendar_month, size: 18),
            label: Text(fmtDateLong(_date)),
          ),
        ),
        const SizedBox(height: 24),
        Text('Turnos disponibles', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.onSurfaceVariant)),
        const SizedBox(height: 8),
        if (_slotsLoading)
          const LoadingView(label: 'Buscando turnos...')
        else if (_slotsError != null)
          ErrorView(message: _slotsError!, onRetry: () => _loadSlots())
        else if (_slots.isEmpty)
          const EmptyView(
            icon: Icons.event_busy,
            title: 'No hay turnos disponibles ese día',
            description: 'Prueba con otra fecha o con otro barbero.',
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final slot in _slots)
                _SlotChip(
                  label: fmtTime(toBogota(slot.start)),
                  selected: _selectedSlot?.start == slot.start,
                  onTap: () => setState(() => _selectedSlot = slot),
                ),
            ],
          ),
        const SizedBox(height: 24),
        Row(
          children: [
            TextButton.icon(
              onPressed: () => _goTo(2),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Regresar'),
            ),
            const Spacer(),
            GoldButton(
              label: 'Ver Resumen',
              icon: Icons.arrow_forward,
              onPressed: _selectedSlot == null ? null : () => _goTo(4),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryStep() {
    final slot = _selectedSlot!;
    final start = toBogota(slot.start);
    final end = toBogota(slot.end);
    final items = _mode == _Mode.combo && _selectedCombo != null
        ? _selectedCombo!.services
        : _selectedServices;
    final muted = Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.onSurfaceVariant);

    return Panel(
      padding: const EdgeInsets.all(20),
      color: AppColors.surfaceContainer,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_submitError != null) ...[
            MessageBanner(_submitError!),
            const SizedBox(height: 16),
          ],
          Wrap(
            spacing: 32,
            runSpacing: 16,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ESPECIALISTA', style: muted),
                  Text(_barberName, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('FECHA Y HORA', style: muted),
                  Text(fmtDateLong(start), style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text(
                    fmtTimeRange(start, end),
                    style: GoogleFonts.jetBrainsMono(color: AppColors.primary),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DURACIÓN TOTAL', style: muted),
                  Text('$_totalDuration min', style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text(
            _mode == _Mode.combo ? 'Combo seleccionado' : 'Servicios seleccionados',
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 8),
          for (final s in items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Expanded(child: Text(s.name)),
                  Text(formatCop(s.price), style: const TextStyle(color: AppColors.onSurfaceVariant)),
                ],
              ),
            ),
          const Divider(height: 28, color: AppColors.surfaceHighest),
          Row(
            children: [
              Text('Total a pagar', style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              Text(
                formatCop(_totalPrice),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              TextButton.icon(
                onPressed: () => _goTo(3),
                icon: const Icon(Icons.arrow_back, size: 18),
                label: const Text('Editar'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GoldButton(
                  label: _submitting ? 'Confirmando...' : 'Confirmar y Reservar',
                  icon: Icons.verified,
                  expand: true,
                  onPressed: _submitting ? null : _confirm,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmed(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.all(32),
      color: AppColors.surfaceContainer,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: AppColors.primaryContainer.withValues(alpha: 0.5), blurRadius: 24),
              ],
            ),
            child: const Icon(Icons.check, size: 32, color: AppColors.onPrimaryContainer),
          ),
          const SizedBox(height: 16),
          Text('¡Cita Agendada con Éxito!', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          const Text(
            'Te esperamos en Imperio Barber. Revisa el boleto con código QR en "Mis Citas" para hacer check-in al llegar.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          GoldButton(label: 'Ver Mis Citas', onPressed: () => context.go('/mis-citas')),
        ],
      ),
    );
  }
}

class _StepBar extends StatelessWidget {
  const _StepBar({required this.step, required this.onStepTap});

  final int step;
  final ValueChanged<int> onStepTap;

  static const List<String> _labels = ['Rituales', 'Maestro', 'Fecha y Hora', 'Confirmación'];

  @override
  Widget build(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.all(16),
      color: AppColors.surfaceContainer,
      child: Column(
        children: [
          Row(
            children: [
              for (var i = 0; i < _labels.length; i++)
                Expanded(
                  child: InkWell(
                    onTap: i + 1 < step ? () => onStepTap(i + 1) : null,
                    child: Column(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: i + 1 <= step ? AppColors.primaryContainer : AppColors.surfaceHigh,
                          ),
                          child: Text(
                            '${i + 1}',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: i + 1 <= step ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _labels[i].toUpperCase(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 0.8,
                            fontWeight: i + 1 <= step ? FontWeight.w700 : FontWeight.w400,
                            color: i + 1 <= step ? AppColors.primary : AppColors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (step - 1) / 3,
              minHeight: 4,
              color: AppColors.primary,
              backgroundColor: AppColors.surfaceHighest,
            ),
          ),
        ],
      ),
    );
  }
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 110,
      child: Material(
        color: selected ? AppColors.primaryContainer : AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: selected ? AppColors.onPrimaryContainer : AppColors.onSurface,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

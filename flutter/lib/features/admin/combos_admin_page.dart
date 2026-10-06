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

/// Combos del catálogo (web/src/app/(admin)/admin/combos/page.tsx).
class CombosAdminPage extends StatefulWidget {
  const CombosAdminPage({super.key});

  @override
  State<CombosAdminPage> createState() => _CombosAdminPageState();
}

class _CombosAdminPageState extends State<CombosAdminPage> {
  late Future<({List<Combo> combos, List<Service> services})> _future;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({List<Combo> combos, List<Service> services})> _load() async {
    final api = context.read<AppServices>();
    final combos = await api.combos(all: true);
    final services = await api.services(all: true);
    return (combos: combos, services: services);
  }

  void _refresh() => setState(() { _future = _load(); });

  Future<void> _toggleActive(Combo c) async {
    setState(() => _actionError = null);
    try {
      await context.read<AppServices>().updateCombo(c.id, {'is_active': !c.isActive});
      _refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    }
  }

  Future<void> _openDialog(List<Service> services, {Combo? combo}) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => _ComboDialog(combo: combo, services: services),
    );
    if (saved == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Combos'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        AsyncContent<({List<Combo> combos, List<Service> services})>(
          future: _future,
          onRetry: _refresh,
          builder: (data) {
            final canCreate = data.services.isNotEmpty;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Align(
                  alignment: Alignment.centerRight,
                  child: GoldButton(
                    label: '+ Nuevo combo',
                    onPressed: canCreate ? () => _openDialog(data.services) : null,
                  ),
                ),
                const SizedBox(height: 16),
                if (_actionError != null) ...[
                  MessageBanner(_actionError!),
                  const SizedBox(height: 12),
                ],
                if (data.services.isEmpty)
                  const EmptyView(
                    icon: Icons.warning,
                    title: 'Crea servicios primero',
                    description: 'Un combo necesita al menos un servicio existente.',
                  )
                else if (data.combos.isEmpty)
                  const EmptyView(icon: Icons.local_offer, title: 'Aún no hay combos')
                else
                  Grid(
                    columns: columnsFor(context, desktop: 2),
                    children: [
                      for (final c in data.combos)
                        _ComboAdminCard(
                          combo: c,
                          onEdit: () => _openDialog(data.services, combo: c),
                          onToggle: () => _toggleActive(c),
                        ),
                    ],
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ComboAdminCard extends StatelessWidget {
  const _ComboAdminCard({required this.combo, required this.onEdit, required this.onToggle});

  final Combo combo;
  final VoidCallback onEdit;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final c = combo;
    return Panel(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (c.imageUrl != null) NetworkImageBox(url: c.imageUrl!, height: 128),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(c.name, style: Theme.of(context).textTheme.titleMedium)),
                    c.isActive
                        ? const Tag('Activo', color: Color(0x33F2CA50), textColor: AppColors.primary)
                        : Tag('Inactivo', color: AppColors.errorContainer.withValues(alpha: 0.4), textColor: AppColors.onErrorContainer),
                  ],
                ),
                const SizedBox(height: 6),
                Text(c.description, style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [for (final s in c.services) Tag(s.name, textColor: AppColors.onSurfaceVariant)],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          formatCop(c.price),
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                        ),
                        Text('${c.durationMinutes} min', style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                      ],
                    ),
                    const Spacer(),
                    c.savings > 0
                        ? Tag('Ahorra ${formatCop(c.savings)}', color: AppColors.primary.withValues(alpha: 0.2), textColor: AppColors.primary)
                        : Tag('Sin ahorro', color: AppColors.errorContainer.withValues(alpha: 0.4), textColor: AppColors.onErrorContainer),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(onPressed: onEdit, child: const Text('Editar')),
                    OutlinedButton(onPressed: onToggle, child: Text(c.isActive ? 'Desactivar' : 'Activar')),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ComboDialog extends StatefulWidget {
  const _ComboDialog({this.combo, required this.services});

  final Combo? combo;
  final List<Service> services;

  @override
  State<_ComboDialog> createState() => _ComboDialogState();
}

class _ComboDialogState extends State<_ComboDialog> {
  late final TextEditingController _name;
  late final TextEditingController _description;
  late final TextEditingController _price;
  late final TextEditingController _imageUrl;
  late final Set<String> _selectedIds;
  late bool _active;
  String? _error;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final c = widget.combo;
    _name = TextEditingController(text: c?.name ?? '');
    _description = TextEditingController(text: c?.description ?? '');
    _price = TextEditingController(text: (c?.price ?? 0).toString());
    _imageUrl = TextEditingController(text: c?.imageUrl ?? '');
    _selectedIds = {...?c?.services.map((s) => s.id)};
    _active = c?.isActive ?? true;
  }

  @override
  void dispose() {
    for (final c in [_name, _description, _price, _imageUrl]) {
      c.dispose();
    }
    super.dispose();
  }

  List<Service> get _selected => widget.services.where((s) => _selectedIds.contains(s.id)).toList();

  Future<void> _save() async {
    final price = int.tryParse(_price.text.trim());
    if (_name.text.trim().isEmpty || _selectedIds.isEmpty || price == null || price < 0) {
      setState(() => _error = 'Ingresa un nombre, selecciona al menos un servicio y un precio válido.');
      return;
    }
    final body = <String, dynamic>{
      'name': _name.text.trim(),
      'description': _description.text.trim(),
      'service_ids': _selectedIds.toList(),
      'price': price,
      'image_url': _imageUrl.text.trim().isEmpty ? null : _imageUrl.text.trim(),
      'is_active': _active,
    };

    final api = context.read<AppServices>();
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      if (widget.combo == null) {
        await api.createCombo(body);
      } else {
        await api.updateCombo(widget.combo!.id, body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final sumPrice = _selected.fold<int>(0, (sum, s) => sum + s.price);
    final sumDuration = _selected.fold<int>(0, (sum, s) => sum + s.durationMinutes);
    final priceNum = int.tryParse(_price.text.trim()) ?? 0;
    final overSum = _selected.isNotEmpty && priceNum > sumPrice;
    final url = _imageUrl.text.trim();

    return FormDialog(
      title: widget.combo == null ? 'Nuevo combo' : 'Editar combo',
      width: 480,
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
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nombre')),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Descripción'),
          ),
          const SizedBox(height: 12),
          const Text('Servicios incluidos', style: TextStyle(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 6),
          Container(
            constraints: const BoxConstraints(maxHeight: 200),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final s in widget.services)
                  CheckboxListTile(
                    dense: true,
                    value: _selectedIds.contains(s.id),
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(s.name),
                    subtitle: Text('${formatCop(s.price)} • ${s.durationMinutes} min'),
                    onChanged: (v) => setState(() {
                      if (v == true) {
                        _selectedIds.add(s.id);
                      } else {
                        _selectedIds.remove(s.id);
                      }
                    }),
                  ),
              ],
            ),
          ),
          if (_selected.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              'Suma individual: ${formatCop(sumPrice)} • Duración total: $sumDuration min',
              style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: _price,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(labelText: 'Precio del combo (COP)'),
          ),
          if (overSum) ...[
            const SizedBox(height: 6),
            Text(
              'El precio del combo supera la suma de sus servicios (${formatCop(sumPrice)}). El servidor rechazará el guardado.',
              style: const TextStyle(fontSize: 12, color: AppColors.error),
            ),
          ],
          const SizedBox(height: 12),
          TextField(
            controller: _imageUrl,
            keyboardType: TextInputType.url,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(labelText: 'URL de imagen (opcional)', hintText: 'https://...'),
          ),
          if (url.isNotEmpty) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(url, height: 110, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox.shrink()),
            ),
          ],
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Combo activo'),
            value: _active,
            onChanged: (v) => setState(() => _active = v),
          ),
        ],
      ),
    );
  }
}

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

/// Servicios del catálogo (web/src/app/(admin)/admin/servicios/page.tsx).
class ServicesAdminPage extends StatefulWidget {
  const ServicesAdminPage({super.key});

  @override
  State<ServicesAdminPage> createState() => _ServicesAdminPageState();
}

class _ServicesAdminPageState extends State<ServicesAdminPage> {
  late Future<List<Service>> _future;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _future = context.read<AppServices>().services(all: true);
  }

  void _refresh() => setState(() { _future = context.read<AppServices>().services(all: true); });

  Future<void> _toggleActive(Service s) async {
    setState(() => _actionError = null);
    try {
      await context.read<AppServices>().updateService(s.id, {'is_active': !s.isActive});
      _refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    }
  }

  Future<void> _openDialog({Service? service}) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => _ServiceDialog(service: service),
    );
    if (saved == true) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Servicios'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        Align(
          alignment: Alignment.centerRight,
          child: GoldButton(label: '+ Nuevo servicio', onPressed: () => _openDialog()),
        ),
        const SizedBox(height: 16),
        if (_actionError != null) ...[
          MessageBanner(_actionError!),
          const SizedBox(height: 12),
        ],
        AsyncContent<List<Service>>(
          future: _future,
          onRetry: _refresh,
          builder: (services) {
            if (services.isEmpty) {
              return const EmptyView(icon: Icons.content_cut, title: 'Aún no hay servicios');
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final s in services) ...[
                  Panel(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            _Thumb(url: s.imageUrl),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(s.name, style: Theme.of(context).textTheme.titleSmall),
                                  Text(
                                    s.description,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Text('${s.durationMinutes} min'),
                            Text(
                              formatCop(s.price),
                              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                            ),
                            s.isActive
                                ? const Tag('Activo', color: Color(0x33F2CA50), textColor: AppColors.primary)
                                : Tag('Inactivo', color: AppColors.errorContainer.withValues(alpha: 0.4), textColor: AppColors.onErrorContainer),
                            OutlinedButton(onPressed: () => _openDialog(service: s), child: const Text('Editar')),
                            OutlinedButton(
                              onPressed: () => _toggleActive(s),
                              child: Text(s.isActive ? 'Desactivar' : 'Activar'),
                            ),
                          ],
                        ),
                      ],
                    ),
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
}

class _Thumb extends StatelessWidget {
  const _Thumb({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    final box = BorderRadius.circular(8);
    if (url == null || url!.isEmpty) {
      return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(color: AppColors.surfaceHigh, borderRadius: box),
        child: const Icon(Icons.content_cut, color: AppColors.onSurfaceVariant, size: 18),
      );
    }
    return ClipRRect(
      borderRadius: box,
      child: Image.network(
        url!,
        width: 44,
        height: 44,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => const SizedBox(width: 44, height: 44),
      ),
    );
  }
}

class _ServiceDialog extends StatefulWidget {
  const _ServiceDialog({this.service});

  final Service? service;

  @override
  State<_ServiceDialog> createState() => _ServiceDialogState();
}

class _ServiceDialogState extends State<_ServiceDialog> {
  late final TextEditingController _name;
  late final TextEditingController _description;
  late final TextEditingController _duration;
  late final TextEditingController _price;
  late final TextEditingController _imageUrl;
  late bool _active;
  String? _error;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final s = widget.service;
    _name = TextEditingController(text: s?.name ?? '');
    _description = TextEditingController(text: s?.description ?? '');
    _duration = TextEditingController(text: (s?.durationMinutes ?? 30).toString());
    _price = TextEditingController(text: (s?.price ?? 0).toString());
    _imageUrl = TextEditingController(text: s?.imageUrl ?? '');
    _active = s?.isActive ?? true;
  }

  @override
  void dispose() {
    for (final c in [_name, _description, _duration, _price, _imageUrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final duration = int.tryParse(_duration.text.trim());
    final price = int.tryParse(_price.text.trim());
    if (_name.text.trim().isEmpty || duration == null || duration <= 0 || price == null || price < 0) {
      setState(() => _error = 'Verifica nombre, duración (minutos) y precio (COP entero).');
      return;
    }
    final body = <String, dynamic>{
      'name': _name.text.trim(),
      'description': _description.text.trim(),
      'duration_minutes': duration,
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
      if (widget.service == null) {
        await api.createService(body);
      } else {
        await api.updateService(widget.service!.id, body);
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
    final url = _imageUrl.text.trim();
    return FormDialog(
      title: widget.service == null ? 'Nuevo servicio' : 'Editar servicio',
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
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _duration,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Duración (min)'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _price,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Precio (COP)'),
                ),
              ),
            ],
          ),
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
              child: Image.network(url, height: 80, width: 80, fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox.shrink()),
            ),
          ],
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Servicio activo'),
            value: _active,
            onChanged: (v) => setState(() => _active = v),
          ),
        ],
      ),
    );
  }
}

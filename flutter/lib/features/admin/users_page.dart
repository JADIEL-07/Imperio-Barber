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

const int _pageSize = 10;

/// Usuarios (web/src/app/(admin)/admin/usuarios/page.tsx).
class UsersPage extends StatefulWidget {
  const UsersPage({super.key});

  @override
  State<UsersPage> createState() => _UsersPageState();
}

class _UsersPageState extends State<UsersPage> {
  final _search = TextEditingController();
  String _role = '';
  int _page = 1;
  String? _actionError;
  late Future<PageResponse<AppUser>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<PageResponse<AppUser>> _load() => context.read<AppServices>().listUsers(
        role: _role,
        search: _search.text.trim(),
        page: _page,
        pageSize: _pageSize,
      );

  void _refresh({int? page}) {
    setState(() {
      if (page != null) _page = page;
      _future = _load();
    });
  }

  Future<void> _toggleActive(AppUser user) async {
    setState(() => _actionError = null);
    try {
      await context.read<AppServices>().updateUser(user.id, {'is_active': !user.isActive});
      _refresh();
    } on ApiException catch (e) {
      if (mounted) setState(() => _actionError = e.message);
    }
  }

  Future<void> _openDialog({AppUser? user}) async {
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => _UserDialog(user: user),
    );
    if (saved == true) _refresh(page: user == null ? 1 : null);
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      children: [
        const PageTitle(eyebrow: 'Panel administrador', title: 'Usuarios'),
        const SizedBox(height: 16),
        const AdminNav(),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            SizedBox(
              width: 320,
              child: TextField(
                controller: _search,
                onSubmitted: (_) => _refresh(page: 1),
                decoration: InputDecoration(
                  hintText: 'Buscar por nombre o correo...',
                  prefixIcon: IconButton(
                    tooltip: 'Buscar',
                    icon: const Icon(Icons.search),
                    onPressed: () => _refresh(page: 1),
                  ),
                ),
              ),
            ),
            DropdownButton<String>(
              value: _role,
              items: const [
                DropdownMenuItem(value: '', child: Text('Todos los roles')),
                DropdownMenuItem(value: 'client', child: Text('Cliente')),
                DropdownMenuItem(value: 'employee', child: Text('Empleado')),
                DropdownMenuItem(value: 'admin', child: Text('Administrador')),
              ],
              onChanged: (v) {
                _role = v ?? '';
                _refresh(page: 1);
              },
            ),
            GoldButton(label: '+ Nuevo usuario', onPressed: () => _openDialog()),
          ],
        ),
        const SizedBox(height: 16),
        if (_actionError != null) ...[
          MessageBanner(_actionError!),
          const SizedBox(height: 12),
        ],
        AsyncContent<PageResponse<AppUser>>(
          future: _future,
          onRetry: _refresh,
          builder: (page) {
            final totalPages = (page.total / _pageSize).ceil().clamp(1, 1 << 30);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (page.items.isEmpty)
                  const EmptyView(icon: Icons.group, title: 'No se encontraron usuarios')
                else
                  for (final u in page.items) ...[
                    _UserCard(
                      user: u,
                      onEdit: () => _openDialog(user: u),
                      onToggle: () => _toggleActive(u),
                    ),
                    const SizedBox(height: 10),
                  ],
                if (totalPages > 1) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: _page <= 1 ? null : () => _refresh(page: _page - 1),
                        child: const Text('Anterior'),
                      ),
                      Text('Página $_page de $totalPages'),
                      TextButton(
                        onPressed: _page >= totalPages ? null : () => _refresh(page: _page + 1),
                        child: const Text('Siguiente'),
                      ),
                    ],
                  ),
                ],
              ],
            );
          },
        ),
      ],
    );
  }
}

class _UserCard extends StatelessWidget {
  const _UserCard({required this.user, required this.onEdit, required this.onToggle});

  final AppUser user;
  final VoidCallback onEdit;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return Panel(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(user.name, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 2),
          Text(user.email, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.onSurfaceVariant)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Tag(roleLabels[user.role] ?? user.role, textColor: AppColors.onSurface),
              user.isActive
                  ? const Tag('Activo', color: Color(0x33F2CA50), textColor: AppColors.primary)
                  : Tag('Inactivo', color: AppColors.errorContainer.withValues(alpha: 0.4), textColor: AppColors.onErrorContainer),
              OutlinedButton(onPressed: onEdit, child: const Text('Editar')),
              OutlinedButton(onPressed: onToggle, child: Text(user.isActive ? 'Desactivar' : 'Activar')),
            ],
          ),
        ],
      ),
    );
  }
}

class _UserDialog extends StatefulWidget {
  const _UserDialog({this.user});

  final AppUser? user;

  @override
  State<_UserDialog> createState() => _UserDialogState();
}

class _UserDialogState extends State<_UserDialog> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  final _password = TextEditingController();
  late String _role;
  String? _error;
  bool _submitting = false;

  bool get _editing => widget.user != null;

  @override
  void initState() {
    super.initState();
    final u = widget.user;
    _name = TextEditingController(text: u?.name ?? '');
    _email = TextEditingController(text: u?.email ?? '');
    _phone = TextEditingController(text: u?.phone ?? '');
    _role = u?.role ?? 'client';
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final api = context.read<AppServices>();
    setState(() {
      _error = null;
      _submitting = true;
    });
    try {
      if (_editing) {
        await api.updateUser(widget.user!.id, {
          'name': _name.text.trim(),
          'phone': _phone.text.trim(),
          'role': _role,
        });
      } else {
        if (_name.text.trim().isEmpty ||
            _email.text.trim().isEmpty ||
            _phone.text.trim().isEmpty ||
            _password.text.isEmpty) {
          setState(() => _error = 'Todos los campos son obligatorios.');
          return;
        }
        await api.createUser(
          name: _name.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim(),
          password: _password.text,
          role: _role,
        );
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
    return FormDialog(
      title: _editing ? 'Editar usuario' : 'Nuevo usuario',
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
            controller: _email,
            enabled: !_editing,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Correo'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Teléfono')),
          if (!_editing) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Contraseña'),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              const Text('Rol', style: TextStyle(color: AppColors.onSurfaceVariant)),
              const SizedBox(width: 16),
              DropdownButton<String>(
                value: _role,
                items: const [
                  DropdownMenuItem(value: 'client', child: Text('Cliente')),
                  DropdownMenuItem(value: 'employee', child: Text('Empleado')),
                  DropdownMenuItem(value: 'admin', child: Text('Administrador')),
                ],
                onChanged: (v) => setState(() => _role = v ?? _role),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

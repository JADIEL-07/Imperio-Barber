import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../data/app_services.dart';
import '../../shell/app_shell.dart';
import '../../state/auth_controller.dart';
import '../../ui/widgets.dart';

/// Mi perfil (web/src/app/(cliente)/perfil/page.tsx).
class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  late final String _email;
  String? _serverError;
  String? _success;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthController>().user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
    _email = user?.email ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _serverError = null;
      _success = null;
    });
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    final auth = context.read<AuthController>();
    try {
      final updated = await context.read<AppServices>().updateMe(
            name: _name.text.trim(),
            phone: _phone.text.trim(),
            password: _password.text.isEmpty ? null : _password.text,
          );
      auth.setUser(updated);
      _password.clear();
      _confirm.clear();
      setState(() => _success = 'Tu perfil se actualizó correctamente.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _serverError = e.message);
    } catch (_) {
      if (mounted) setState(() => _serverError = 'No pudimos actualizar tu perfil.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      maxWidth: 576,
      children: [
        const PageTitle(eyebrow: 'Cuenta', title: 'Mi Perfil'),
        const SizedBox(height: 24),
        Panel(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_serverError != null) ...[
                  MessageBanner(_serverError!),
                  const SizedBox(height: 16),
                ],
                if (_success != null) ...[
                  MessageBanner(_success!, isError: false),
                  const SizedBox(height: 16),
                ],
                TextFormField(
                  initialValue: _email,
                  enabled: false,
                  decoration: const InputDecoration(labelText: 'Correo electrónico'),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Nombre completo'),
                  validator: (v) => (v ?? '').trim().isEmpty ? 'El nombre es obligatorio.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Teléfono'),
                  validator: (v) => (v ?? '').trim().isEmpty ? 'El teléfono es obligatorio.' : null,
                ),
                const SizedBox(height: 24),
                const Divider(color: AppColors.surfaceHigh),
                const SizedBox(height: 8),
                const Text('Cambiar contraseña (opcional)', style: TextStyle(color: AppColors.onSurfaceVariant)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Nueva contraseña'),
                  validator: (v) => (v ?? '').isNotEmpty && v!.length < 8 ? 'Mínimo 8 caracteres.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirm,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirmar nueva contraseña'),
                  validator: (v) =>
                      _password.text.isNotEmpty && v != _password.text ? 'Las contraseñas no coinciden.' : null,
                ),
                const SizedBox(height: 24),
                GoldButton(
                  label: _submitting ? 'Guardando...' : 'Guardar cambios',
                  expand: true,
                  onPressed: _submitting ? null : _save,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

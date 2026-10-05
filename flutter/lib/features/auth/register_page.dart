import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../shell/app_shell.dart';
import '../../state/auth_controller.dart';
import '../../ui/widgets.dart';

final RegExp _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  String? _serverError;
  bool _submitting = false;

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _serverError = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      await context.read<AuthController>().register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            phone: _phone.text.trim(),
            password: _password.text,
          );
      if (mounted) context.go('/mis-citas');
    } on ApiException catch (e) {
      if (mounted) setState(() => _serverError = e.message);
    } catch (_) {
      if (mounted) setState(() => _serverError = 'No pudimos crear tu cuenta. Intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ContentScroll(
      maxWidth: 448,
      children: [
        const SizedBox(height: 16),
        const Text(
          'ÚNETE AL CLUB',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2.2),
        ),
        const SizedBox(height: 4),
        Text('Crea tu cuenta', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
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
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Nombre completo'),
                  validator: (v) => (v ?? '').trim().isEmpty ? 'El nombre es obligatorio.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Correo electrónico'),
                  validator: (v) {
                    final value = (v ?? '').trim();
                    if (value.isEmpty) return 'El correo es obligatorio.';
                    if (!_emailRegex.hasMatch(value)) return 'Ingresa un correo válido.';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Teléfono'),
                  validator: (v) => (v ?? '').trim().isEmpty ? 'El teléfono es obligatorio.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Contraseña'),
                  validator: (v) => (v ?? '').length < 8 ? 'Mínimo 8 caracteres.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirm,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Confirmar contraseña'),
                  validator: (v) => v != _password.text ? 'Las contraseñas no coinciden.' : null,
                ),
                const SizedBox(height: 24),
                GoldButton(
                  label: _submitting ? 'Creando cuenta...' : 'Registrarme',
                  expand: true,
                  onPressed: _submitting ? null : _submit,
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('¿Ya tienes cuenta? Inicia sesión'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

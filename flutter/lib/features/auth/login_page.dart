import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../shell/app_shell.dart';
import '../../state/auth_controller.dart';
import '../../ui/widgets.dart';

final RegExp _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, this.next});

  /// Ruta a la que volver tras iniciar sesión (?next=...).
  final String? next;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _serverError;
  bool _submitting = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _serverError = null);
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    final auth = context.read<AuthController>();
    try {
      await auth.login(email: _email.text.trim(), password: _password.text);
      if (!mounted) return;
      final user = auth.user!;
      final target = widget.next ?? roleHome(user.role).path;
      context.go(target);
    } on ApiException catch (e) {
      if (mounted) setState(() => _serverError = e.message);
    } catch (_) {
      if (mounted) setState(() => _serverError = 'No pudimos iniciar sesión. Verifica tus datos.');
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
        Text(
          'BIENVENIDO DE NUEVO',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2.2),
        ),
        const SizedBox(height: 4),
        Text('Inicia sesión', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
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
                  controller: _password,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Contraseña'),
                  validator: (v) => (v ?? '').isEmpty ? 'La contraseña es obligatoria.' : null,
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 24),
                GoldButton(
                  label: _submitting ? 'Ingresando...' : 'Iniciar sesión',
                  expand: true,
                  onPressed: _submitting ? null : _submit,
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/registro'),
                    child: const Text('¿No tienes cuenta? Regístrate aquí'),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../state/auth_controller.dart';
import '../ui/widgets.dart';

/// Protección de rutas por rol a nivel de UX (RouteGuard.tsx).
/// El backend es quien aplica los permisos; esto evita mostrar pantallas que fallarían.
class RoleGuard extends StatelessWidget {
  const RoleGuard({super.key, required this.roles, required this.child});

  final List<String> roles;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();

    if (auth.loading) {
      return const LoadingView(label: 'Verificando sesión...');
    }

    final user = auth.user;
    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/login');
      });
      return const LoadingView(label: 'Verificando sesión...');
    }

    if (!roles.contains(user.role)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) context.go('/');
      });
      return const LoadingView(label: 'Verificando sesión...');
    }

    return child;
  }
}

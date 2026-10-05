import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';

const List<({String path, String label})> _adminItems = [
  (path: '/admin', label: 'Dashboard'),
  (path: '/admin/usuarios', label: 'Usuarios'),
  (path: '/admin/empleados', label: 'Empleados'),
  (path: '/admin/servicios', label: 'Servicios'),
  (path: '/admin/combos', label: 'Combos'),
  (path: '/admin/citas', label: 'Citas'),
  (path: '/admin/configuracion', label: 'Configuración'),
];

/// Pestañas del panel de administrador (AdminNav.tsx).
class AdminNav extends StatelessWidget {
  const AdminNav({super.key});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceHigh,
        borderRadius: BorderRadius.circular(8),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final item in _adminItems)
              Builder(
                builder: (context) {
                  final active = item.path == '/admin'
                      ? location == '/admin'
                      : location.startsWith(item.path);
                  return Padding(
                    padding: const EdgeInsets.only(right: 4),
                    child: Material(
                      color: active ? AppColors.primaryContainer : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(6),
                        onTap: () => context.go(item.path),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          child: Text(
                            item.label,
                            style: TextStyle(
                              color: active ? AppColors.onPrimaryContainer : AppColors.onSurfaceVariant,
                              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

import 'package:go_router/go_router.dart';

import 'features/admin/appointments_admin_page.dart';
import 'features/admin/barbers_page.dart';
import 'features/admin/combos_admin_page.dart';
import 'features/admin/dashboard_page.dart';
import 'features/admin/services_admin_page.dart';
import 'features/admin/settings_page.dart';
import 'features/admin/users_page.dart';
import 'features/auth/login_page.dart';
import 'features/auth/register_page.dart';
import 'features/barber/agenda_page.dart';
import 'features/barber/availability_page.dart';
import 'features/client/booking_page.dart';
import 'features/client/my_appointments_page.dart';
import 'features/client/profile_page.dart';
import 'features/public/combos_page.dart';
import 'features/public/home_page.dart';
import 'features/public/services_page.dart';
import 'shell/app_shell.dart';
import 'shell/role_guard.dart';

/// Mismas rutas que el App Router de Next.js (web/src/app), con los mismos paths.
final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        // Públicas
        GoRoute(path: '/', builder: (_, _) => const HomePage()),
        GoRoute(path: '/servicios', builder: (_, _) => const ServicesPage()),
        GoRoute(path: '/combos', builder: (_, _) => const CombosPage()),
        GoRoute(
          path: '/login',
          builder: (_, state) => LoginPage(next: state.uri.queryParameters['next']),
        ),
        GoRoute(path: '/registro', builder: (_, _) => const RegisterPage()),

        // Cliente
        GoRoute(
          path: '/reservar',
          builder: (_, _) => const RoleGuard(roles: ['client'], child: BookingPage()),
        ),
        GoRoute(
          path: '/mis-citas',
          builder: (_, _) => const RoleGuard(roles: ['client'], child: MyAppointmentsPage()),
        ),
        GoRoute(
          path: '/perfil',
          builder: (_, _) => const RoleGuard(roles: ['client'], child: ProfilePage()),
        ),

        // Barbero
        GoRoute(
          path: '/empleado/agenda',
          builder: (_, _) => const RoleGuard(roles: ['employee'], child: AgendaPage()),
        ),
        GoRoute(
          path: '/empleado/disponibilidad',
          builder: (_, _) => const RoleGuard(roles: ['employee'], child: AvailabilityPage()),
        ),

        // Administrador
        GoRoute(
          path: '/admin',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: DashboardPage()),
        ),
        GoRoute(
          path: '/admin/usuarios',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: UsersPage()),
        ),
        GoRoute(
          path: '/admin/empleados',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: BarbersPage()),
        ),
        GoRoute(
          path: '/admin/servicios',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: ServicesAdminPage()),
        ),
        GoRoute(
          path: '/admin/combos',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: CombosAdminPage()),
        ),
        GoRoute(
          path: '/admin/citas',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: AppointmentsAdminPage()),
        ),
        GoRoute(
          path: '/admin/configuracion',
          builder: (_, _) => const RoleGuard(roles: ['admin'], child: SettingsPage()),
        ),
      ],
    ),
  ],
);

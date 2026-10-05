import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../state/auth_controller.dart';
import '../ui/widgets.dart';

/// Destino principal de cada rol (ROLE_HOME en Header.tsx).
({String path, String label}) roleHome(String role) {
  switch (role) {
    case 'client':
      return (path: '/mis-citas', label: 'Mis Citas');
    case 'employee':
      return (path: '/empleado/agenda', label: 'Mi Agenda');
    case 'admin':
      return (path: '/admin', label: 'Panel');
    default:
      return (path: '/', label: '');
  }
}

/// Barra superior + menú lateral (Header.tsx) alrededor de todas las pantallas.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user;
    final wide = MediaQuery.sizeOf(context).width >= 1024;
    final home = user == null ? null : roleHome(user.role);

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 80,
        titleSpacing: 16,
        title: Row(
          children: [
            const _Brand(),
            if (wide) ...[
              const SizedBox(width: 40),
              const _NavLinks(),
              if (home != null && home.label.isNotEmpty) ...[
                const SizedBox(width: 24),
                _NavLink(label: home.label, path: home.path, highlight: true),
              ],
            ],
          ],
        ),
        actions: [
          _AuthActions(wide: wide, auth: auth),
          const SizedBox(width: 8),
        ],
      ),
      drawer: wide ? null : _MenuDrawer(auth: auth),
      body: child,
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go('/'),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.surfaceHigh,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(color: AppColors.primaryContainer.withValues(alpha: 0.25), blurRadius: 16),
              ],
            ),
            child: const Center(child: LogoMark(size: 24)),
          ),
          const SizedBox(width: 12),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'IMPERIO',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                    ),
              ),
              const Text(
                'BARBERSHOP',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NavLinks extends StatelessWidget {
  const _NavLinks();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _NavLink(label: 'Inicio', path: '/'),
        SizedBox(width: 24),
        _NavLink(label: 'Servicios', path: '/servicios'),
        SizedBox(width: 24),
        _NavLink(label: 'Combos', path: '/combos'),
      ],
    );
  }
}

class _NavLink extends StatelessWidget {
  const _NavLink({required this.label, required this.path, this.highlight = false});

  final String label;
  final String path;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: () => context.go(path),
      style: TextButton.styleFrom(
        foregroundColor: highlight ? AppColors.primary : AppColors.onSurfaceVariant,
      ),
      child: Text(
        label,
        style: TextStyle(fontWeight: highlight ? FontWeight.w700 : FontWeight.w600),
      ),
    );
  }
}

class _AuthActions extends StatelessWidget {
  const _AuthActions({required this.wide, required this.auth});

  final bool wide;
  final AuthController auth;

  @override
  Widget build(BuildContext context) {
    if (auth.loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 12),
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
        ),
      );
    }

    final user = auth.user;
    if (user == null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (wide)
            TextButton(onPressed: () => context.go('/login'), child: const Text('Iniciar sesión')),
          GoldButton(label: 'Reservar Cita', onPressed: () => context.go('/login')),
        ],
      );
    }

    final home = roleHome(user.role);
    final reserveHref = user.role == 'client' ? '/reservar' : home.path;
    final reserveLabel = user.role == 'client' ? 'Reservar Cita' : home.label;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (wide)
          GoldButton(label: reserveLabel, onPressed: () => context.go(reserveHref)),
        const SizedBox(width: 8),
        PopupMenuButton<String>(
          tooltip: 'Menú de usuario',
          onSelected: (value) async {
            if (value == 'perfil') {
              context.go('/perfil');
            } else if (value == 'logout') {
              await auth.logout();
              if (context.mounted) context.go('/');
            }
          },
          itemBuilder: (_) => [
            PopupMenuItem<String>(
              enabled: false,
              child: Text(user.name, overflow: TextOverflow.ellipsis),
            ),
            const PopupMenuDivider(),
            if (user.role == 'client')
              const PopupMenuItem<String>(value: 'perfil', child: Text('Mi perfil')),
            const PopupMenuItem<String>(
              value: 'logout',
              child: Text('Cerrar sesión', style: TextStyle(color: AppColors.error)),
            ),
          ],
          child: CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.primary,
            child: Text(
              user.initial,
              style: const TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }
}

class _MenuDrawer extends StatelessWidget {
  const _MenuDrawer({required this.auth});

  final AuthController auth;

  void _go(BuildContext context, String path) {
    Scaffold.maybeOf(context)?.closeDrawer();
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final user = auth.user;
    final home = user == null ? null : roleHome(user.role);

    return Drawer(
      child: SafeArea(
        child: ListView(
          children: [
            const Padding(padding: EdgeInsets.all(16), child: _Brand()),
            const Divider(),
            ListTile(title: const Text('Inicio'), onTap: () => _go(context, '/')),
            ListTile(title: const Text('Servicios'), onTap: () => _go(context, '/servicios')),
            ListTile(title: const Text('Combos'), onTap: () => _go(context, '/combos')),
            if (home != null && home.label.isNotEmpty)
              ListTile(
                title: Text(
                  home.label,
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                ),
                onTap: () => _go(context, home.path),
              ),
            const Divider(),
            if (user == null)
              ListTile(title: const Text('Iniciar sesión'), onTap: () => _go(context, '/login'))
            else ...[
              if (user.role == 'client')
                ListTile(title: const Text('Mi perfil'), onTap: () => _go(context, '/perfil')),
              ListTile(
                title: const Text('Cerrar sesión', style: TextStyle(color: AppColors.error)),
                onTap: () async {
                  Scaffold.maybeOf(context)?.closeDrawer();
                  await auth.logout();
                  if (context.mounted) context.go('/');
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Contenido desplazable con ancho máximo centrado y pie de página opcional.
class ContentScroll extends StatelessWidget {
  const ContentScroll({
    super.key,
    required this.children,
    this.maxWidth = 1280,
    this.footer = true,
  });

  final List<Widget> children;
  final double maxWidth;
  final bool footer;

  @override
  Widget build(BuildContext context) {
    final margin = pageMargin(context);
    return SingleChildScrollView(
      child: Column(
        children: [
          Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: Padding(
                padding: EdgeInsets.fromLTRB(margin, 24, margin, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: children,
                ),
              ),
            ),
          ),
          if (footer) const AppFooter(),
        ],
      ),
    );
  }
}

class _FooterLine extends StatelessWidget {
  const _FooterLine({required this.icon, required this.text, required this.style});

  final IconData icon;
  final String text;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: style)),
        ],
      ),
    );
  }
}

/// Pie de página (Footer.tsx).
class AppFooter extends StatelessWidget {
  const AppFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final muted = const TextStyle(color: AppColors.onSurfaceVariant, fontSize: 13, height: 1.5);
    final strong = const TextStyle(color: AppColors.onSurface, fontWeight: FontWeight.w600, fontSize: 15);

    Widget column(List<Widget> children) => SizedBox(
          width: 260,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
        );

    return Container(
      width: double.infinity,
      color: AppColors.surfaceLowest,
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
      child: Column(
        children: [
          Wrap(
            spacing: 40,
            runSpacing: 32,
            children: [
              column([
                Row(children: [
                  const LogoMark(size: 20),
                  const SizedBox(width: 8),
                  Text('IMPERIO BARBER', style: strong),
                ]),
                const SizedBox(height: 8),
                Text(
                  'Atelier de barbería de autor: cortes de precisión, rituales de afeitado y una experiencia pensada para el hombre moderno.',
                  style: muted,
                ),
                const SizedBox(height: 12),
                const Tag('Reservas en línea 24/7', color: AppColors.surfaceHigh, textColor: AppColors.primary),
              ]),
              column([
                Text('Sede Central', style: strong),
                const SizedBox(height: 8),
                _FooterLine(icon: Icons.location_on, text: 'Calle 94 # 11A - 28, Chicó Norte, Bogotá D.C.', style: muted),
                _FooterLine(icon: Icons.call, text: '+57 (601) 745-9820', style: muted),
                _FooterLine(icon: Icons.local_parking, text: 'Valet Parking disponible', style: muted),
              ]),
              column([
                Text('Horario de Atención', style: strong),
                const SizedBox(height: 8),
                Text('Lunes a Viernes: 08:00 AM – 09:00 PM', style: muted),
                Text('Sábados: 08:00 AM – 08:00 PM', style: muted),
                Text('Domingos y Festivos: 10:00 AM – 06:00 PM', style: muted),
              ]),
            ],
          ),
          const SizedBox(height: 32),
          const Divider(color: AppColors.surfaceHigh),
          const SizedBox(height: 12),
          Text(
            '© 2026 Imperio Barber. Todos los derechos reservados.',
            style: muted.copyWith(fontSize: 11),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

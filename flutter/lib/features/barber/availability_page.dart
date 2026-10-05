import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../shell/app_shell.dart';
import '../../state/auth_controller.dart';
import '../../ui/widgets.dart';
import 'schedule_manager.dart';

/// Mi Disponibilidad (web/src/app/(empleado)/empleado/disponibilidad/page.tsx).
class AvailabilityPage extends StatelessWidget {
  const AvailabilityPage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthController>().user;
    return ContentScroll(
      maxWidth: 1000,
      children: [
        const PageTitle(eyebrow: 'Panel barbero', title: 'Mi Disponibilidad'),
        const SizedBox(height: 24),
        if (user == null)
          const LoadingView()
        else
          ScheduleManager(barberId: user.id),
      ],
    );
  }
}

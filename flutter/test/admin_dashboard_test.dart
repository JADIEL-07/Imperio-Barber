import 'package:flutter_test/flutter_test.dart';
import 'package:imperio_barber/core/format.dart';

import 'support/fake_api.dart';

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('dashboard del administrador', () {
    testWidgets('muestra los indicadores del día y del mes desde /bookings/stats', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/stats', FakeResponse(200, Fixtures.stats()));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user(role: 'admin')).pump(tester, location: '/admin');

      expect(find.text('CITAS DE HOY'), findsOneWidget);
      expect(find.text('4'), findsWidgets);
      expect(find.text('INGRESOS DEL MES'), findsOneWidget);
      expect(find.text(formatCop(1250000)), findsOneWidget);
      expect(find.text(formatCop(300000)), findsOneWidget);
    });

    testWidgets('muestra los servicios más pedidos y el ingreso por servicio', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/stats', FakeResponse(200, Fixtures.stats()));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user(role: 'admin')).pump(tester, location: '/admin');

      expect(find.text('Servicios más pedidos (mes)'), findsOneWidget);
      expect(find.text('Corte Signature'), findsWidgets);
      expect(find.text(formatCop(900000)), findsOneWidget);
      expect(find.text('9'), findsOneWidget);
    });

    testWidgets('el panel de admin tiene navegación a sus secciones', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/stats', FakeResponse(200, Fixtures.stats()));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user(role: 'admin')).pump(tester, location: '/admin');

      for (final seccion in ['Usuarios', 'Empleados', 'Servicios', 'Combos', 'Citas', 'Configuración']) {
        expect(find.text(seccion), findsWidgets);
      }
    });
  });
}

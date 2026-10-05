import 'package:flutter_test/flutter_test.dart';

import 'support/fake_api.dart';

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('control de acceso por rol (RoleGuard)', () {
    testWidgets('un invitado que abre el panel de admin es enviado a login', (tester) async {
      await TestApp(adapter: FakeAdapter()).pump(tester, location: '/admin');

      expect(currentLocation(), '/login');
      expect(find.text('Inicia sesión'), findsOneWidget);
    });

    testWidgets('un invitado que abre Mis Citas es enviado a login', (tester) async {
      await TestApp(adapter: FakeAdapter()).pump(tester, location: '/mis-citas');

      expect(currentLocation(), '/login');
    });

    testWidgets('un cliente ve sus citas sin ser redirigido', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([])));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/mis-citas');

      expect(currentLocation(), '/mis-citas');
      expect(find.text('Mis Citas'), findsOneWidget);
    });

    testWidgets('un barbero que abre su agenda la ve sin ser redirigido', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([])));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user(role: 'employee')).pump(
        tester,
        location: '/empleado/agenda',
      );

      expect(currentLocation(), '/empleado/agenda');
      expect(find.text('Mi Agenda'), findsOneWidget);
    });
  });
}

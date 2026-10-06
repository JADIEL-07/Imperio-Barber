import 'package:flutter_test/flutter_test.dart';

import 'support/fake_api.dart';

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('mis citas', () {
    testWidgets('separa próximas e historial y muestra el boleto de la próxima cita', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([
          Fixtures.appointment(id: 'cita-proxima'),
          Fixtures.appointment(id: 'cita-pasada', status: 'completed', canCancel: false),
        ])));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/mis-citas');

      expect(find.text('Próximas (1)'), findsOneWidget);
      expect(find.text('Historial (1)'), findsOneWidget);
      expect(find.text('CHECK-IN HABILITADO'), findsOneWidget);
      expect(find.text('Avisar que ya llegué'), findsOneWidget);

      await tester.tap(find.text('Historial (1)'));
      await TestApp.settle(tester);
      expect(find.text('COMPLETADA'), findsOneWidget); // etiquetas en mayúsculas
      expect(find.text('Avisar que ya llegué'), findsNothing);
    });

    testWidgets('no permite cancelar con menos de 2 horas de anticipación', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([
          Fixtures.appointment(canCancel: false),
        ])));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/mis-citas');

      await tester.tap(find.text('Cancelar'));
      await TestApp.settle(tester);

      expect(find.text('Cancelación Bloqueada'), findsOneWidget);
      expect(adapter.sent('PATCH', '/bookings/appointments/cita-1'), isEmpty);
    });

    testWidgets('cancelar pide confirmación y envía el estado cancelled', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([Fixtures.appointment()])))
        ..on(
          'PATCH',
          '/bookings/appointments/cita-1',
          FakeResponse(200, Fixtures.appointment(status: 'cancelled', canCancel: false)),
        );
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/mis-citas');

      await tester.tap(find.text('Cancelar'));
      await TestApp.settle(tester);
      expect(find.text('Cancelar cita'), findsOneWidget);

      await tester.tap(find.text('Sí, cancelar'));
      await TestApp.settle(tester);

      expect(adapter.sent('PATCH', '/bookings/appointments/cita-1').single.data, {'status': 'cancelled'});
    });

    testWidgets('sin citas próximas muestra el estado vacío', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([])));
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/mis-citas');

      expect(find.text('No tienes citas próximas'), findsOneWidget);
    });
  });
}

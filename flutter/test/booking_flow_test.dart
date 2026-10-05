import 'package:flutter_test/flutter_test.dart';
import 'package:imperio_barber/core/format.dart';
import 'package:imperio_barber/ui/widgets.dart';

import 'support/fake_api.dart';

/// Rutas de catálogo, barberos y disponibilidad que usan todos los casos de reserva.
FakeAdapter _adapterConCatalogo({FakeResponse? confirmacion}) {
  final date = Fixtures.futureDate();
  return FakeAdapter()
    ..on('GET', '/catalog/services', FakeResponse(200, [
      Fixtures.service(),
      Fixtures.service(id: 'svc-2', name: 'Barba', price: 20000, duration: 20),
    ]))
    ..on('GET', '/catalog/combos', FakeResponse(200, [Fixtures.combo()]))
    ..on('GET', '/bookings/barbers', FakeResponse(200, [Fixtures.barber()]))
    ..on('GET', '/bookings/availability', FakeResponse(200, {
      'slots': [Fixtures.slot(date, '10:00'), Fixtures.slot(date, '11:00')],
    }))
    ..on('POST', '/bookings/appointments', confirmacion ?? FakeResponse(201, Fixtures.appointment()));
}

/// Hora de un turno como la muestra la app (hora de Bogotá).
String _hora(String date, String hour) => fmtTime(toBogota('${date}T$hour:00-05:00'));

Future<void> _llegarAResumen(WidgetTester tester) async {
  await tester.tap(find.text('Corte Signature'));
  await TestApp.settle(tester);
  await tester.tap(find.widgetWithText(GoldButton, 'Continuar a Selección de Barbero'));
  await TestApp.settle(tester);
  await tester.tap(find.widgetWithText(GoldButton, 'Continuar a Calendario'));
  await TestApp.settle(tester);
  await tester.tap(find.text(_hora(Fixtures.futureDate(), '10:00')));
  await TestApp.settle(tester);
  await tester.tap(find.widgetWithText(GoldButton, 'Ver Resumen'));
  await TestApp.settle(tester);
}

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('reserva en 4 pasos', () {
    testWidgets('no permite continuar sin elegir un servicio', (tester) async {
      await TestApp(adapter: _adapterConCatalogo(), sessionUser: Fixtures.user()).pump(tester, location: '/reservar');

      expect(find.text('Corte Signature'), findsOneWidget);
      final boton = tester.widget<GoldButton>(find.widgetWithText(GoldButton, 'Continuar a Selección de Barbero'));
      expect(boton.onPressed, isNull);
    });

    testWidgets('elegir un servicio habilita el paso de barbero', (tester) async {
      await TestApp(adapter: _adapterConCatalogo(), sessionUser: Fixtures.user()).pump(tester, location: '/reservar');

      await tester.tap(find.text('Corte Signature'));
      await TestApp.settle(tester);
      await tester.tap(find.widgetWithText(GoldButton, 'Continuar a Selección de Barbero'));
      await TestApp.settle(tester);

      expect(find.text('Mateo Silva'), findsOneWidget);
      expect(find.text('Cualquiera disponible'), findsOneWidget);
    });

    testWidgets('muestra los turnos del día y el resumen con el total', (tester) async {
      await TestApp(adapter: _adapterConCatalogo(), sessionUser: Fixtures.user()).pump(tester, location: '/reservar');
      await _llegarAResumen(tester);

      expect(find.text('Total a pagar'), findsOneWidget);
      expect(find.text(formatCop(75000)), findsWidgets);
      expect(find.text('Confirmar y Reservar'), findsOneWidget);
    });

    testWidgets('confirmar envía los servicios elegidos y muestra la confirmación', (tester) async {
      final adapter = _adapterConCatalogo();
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/reservar');
      await _llegarAResumen(tester);

      await tester.tap(find.widgetWithText(GoldButton, 'Confirmar y Reservar'));
      await TestApp.settle(tester);

      final envio = adapter.sent('POST', '/bookings/appointments').single;
      expect(envio.data['service_ids'], ['svc-1']);
      expect(envio.data['barber_id'], isNull);
      expect(find.text('¡Cita Agendada con Éxito!'), findsOneWidget);
    });

    testWidgets('si la franja ya fue ocupada (409) vuelve a elegir fecha y hora', (tester) async {
      final adapter = _adapterConCatalogo(
        confirmacion: const FakeResponse(409, {
          'error': {'code': 'CONFLICT', 'message': 'Franja ocupada'},
        }),
      );
      await TestApp(adapter: adapter, sessionUser: Fixtures.user()).pump(tester, location: '/reservar');
      await _llegarAResumen(tester);

      await tester.tap(find.widgetWithText(GoldButton, 'Confirmar y Reservar'));
      await TestApp.settle(tester);

      expect(
        find.text('Esa franja se acaba de ocupar por otro cliente. Elige otra.'),
        findsOneWidget,
      );
      expect(find.text('Turnos disponibles'), findsOneWidget);
      expect(find.text('¡Cita Agendada con Éxito!'), findsNothing);
    });
  });
}

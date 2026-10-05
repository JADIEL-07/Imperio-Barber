import 'package:flutter_test/flutter_test.dart';
import 'package:imperio_barber/ui/widgets.dart';

import 'support/fake_api.dart';

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('inicio de sesión', () {
    testWidgets('muestra errores de validación con el formulario vacío', (tester) async {
      await TestApp(adapter: FakeAdapter()).pump(tester, location: '/login');

      await tester.tap(find.widgetWithText(GoldButton, 'Iniciar sesión'));
      await TestApp.settle(tester);

      expect(find.text('El correo es obligatorio.'), findsOneWidget);
      expect(find.text('La contraseña es obligatoria.'), findsOneWidget);
      expect(currentLocation(), '/login');
    });

    testWidgets('muestra el mensaje de la API cuando las credenciales son incorrectas', (tester) async {
      final adapter = FakeAdapter()
        ..on(
          'POST',
          '/auth/login',
          const FakeResponse(401, {
            'error': {'code': 'UNAUTHORIZED', 'message': 'Correo o contraseña incorrectos'},
          }),
        );
      await TestApp(adapter: adapter).pump(tester, location: '/login');

      await tester.enterText(find.byType(TextFormField).at(0), 'ana@example.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'clave-mala');
      await tester.tap(find.widgetWithText(GoldButton, 'Iniciar sesión'));
      await TestApp.settle(tester);

      expect(find.text('Correo o contraseña incorrectos'), findsOneWidget);
      expect(currentLocation(), '/login');
    });

    testWidgets('un cliente que inicia sesión llega a Mis Citas', (tester) async {
      final adapter = FakeAdapter()
        ..on('POST', '/auth/login', FakeResponse(200, Fixtures.user()))
        ..on('GET', '/bookings/appointments', FakeResponse(200, Fixtures.page([])));
      await TestApp(adapter: adapter).pump(tester, location: '/login');

      await tester.enterText(find.byType(TextFormField).at(0), 'ana@example.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'secreto1');
      await tester.tap(find.widgetWithText(GoldButton, 'Iniciar sesión'));
      await TestApp.settle(tester);

      expect(currentLocation(), '/mis-citas');
      expect(adapter.sent('POST', '/auth/login').single.data, {'email': 'ana@example.com', 'password': 'secreto1'});
    });
  });
}

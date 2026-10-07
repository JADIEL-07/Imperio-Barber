import 'package:flutter_test/flutter_test.dart';
import 'package:imperio_barber/core/format.dart';

import 'support/fake_api.dart';

void main() {
  setUpAll(() async {
    await setUpLocale();
  });

  group('carta pública de servicios', () {
    testWidgets('muestra cada servicio con su precio en pesos colombianos', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/catalog/services', FakeResponse(200, [
          Fixtures.service(),
          Fixtures.service(id: 'svc-2', name: 'Barba', price: 20000, duration: 20),
        ]));
      await TestApp(adapter: adapter).pump(tester, location: '/servicios');

      expect(find.text('Servicios'), findsOneWidget);
      expect(find.text('Corte Signature'), findsOneWidget);
      expect(find.text('Barba'), findsOneWidget);
      expect(find.text(formatCop(75000)), findsOneWidget);
      expect(find.text(formatCop(20000)), findsOneWidget);
      expect(find.text('45 min'), findsOneWidget);
    });

    testWidgets('si la API falla muestra el error y permite reintentar', (tester) async {
      final adapter = FakeAdapter()
        ..on('GET', '/catalog/services', const FakeResponse(500, {
          'error': {'code': 'INTERNAL', 'message': 'Error interno'},
        }));
      await TestApp(adapter: adapter).pump(tester, location: '/servicios');

      expect(find.text('Ocurrió un error al cargar la información.'), findsOneWidget);
      expect(find.text('Reintentar'), findsOneWidget);

      adapter.on('GET', '/catalog/services', FakeResponse(200, [Fixtures.service()]));
      await tester.tap(find.text('Reintentar'));
      await TestApp.settle(tester);

      expect(find.text('Corte Signature'), findsOneWidget);
    });

    testWidgets('sin servicios publicados muestra el estado vacío', (tester) async {
      final adapter = FakeAdapter()..on('GET', '/catalog/services', FakeResponse(200, <Object>[]));
      await TestApp(adapter: adapter).pump(tester, location: '/servicios');

      expect(find.text('Aún no hay servicios publicados'), findsOneWidget);
    });
  });

  group('combos', () {
    testWidgets('muestra el ahorro y los servicios incluidos', (tester) async {
      final adapter = FakeAdapter()..on('GET', '/catalog/combos', FakeResponse(200, [Fixtures.combo()]));
      await TestApp(adapter: adapter).pump(tester, location: '/combos');

      expect(find.text('Ritual Imperio'), findsOneWidget);
      expect(find.text('AHORRAS ${formatCop(15000)}'), findsOneWidget);
      expect(find.text('BARBA'), findsOneWidget); // las etiquetas de servicio se muestran en mayúsculas
      expect(find.text(formatCop(80000)), findsOneWidget);
    });
  });

  group('descargas de la app', () {
    testWidgets('lista las cuatro plataformas con sus instaladores', (tester) async {
      await TestApp(adapter: FakeAdapter()).pump(tester, location: '/descargas');

      expect(find.text('Descargar la app'), findsOneWidget);
      for (final platform in ['Android', 'iPhone / iPad', 'Windows', 'Linux']) {
        expect(find.text(platform), findsOneWidget);
      }
      expect(find.text('Descargar APK'), findsOneWidget);
      expect(find.text('Instalador (.exe)'), findsOneWidget);
      expect(find.text('AppImage (cualquier distro)'), findsOneWidget);
    });
  });
}

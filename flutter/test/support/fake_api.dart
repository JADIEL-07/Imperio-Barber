import 'dart:convert';
import 'dart:ui' show Size;
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:imperio_barber/core/api_client.dart';
import 'package:imperio_barber/core/format.dart';
import 'package:imperio_barber/core/theme.dart';
import 'package:imperio_barber/data/app_services.dart';
import 'package:imperio_barber/router.dart';
import 'package:imperio_barber/state/auth_controller.dart';
import 'package:provider/provider.dart';

/// Respuesta canned para una ruta de la API.
class FakeResponse {
  const FakeResponse(this.status, [this.body]);

  final int status;
  final Object? body;
}

typedef FakeHandler = FakeResponse Function(RequestOptions options);

/// Adaptador de red de Dio: responde con JSON de prueba y registra cada petición.
/// Así se ejercita el cliente real (AppServices -> ApiClient -> Dio) sin tocar la red.
class FakeAdapter implements HttpClientAdapter {
  final Map<String, FakeHandler> routes = {};
  final List<RequestOptions> requests = [];

  /// Atajo para rutas que no dependen de la petición.
  void on(String method, String path, FakeResponse response) {
    routes['$method $path'] = (_) => response;
  }

  /// Peticiones registradas que coinciden con método y ruta (sin el prefijo /api).
  List<RequestOptions> sent(String method, String path) => requests
      .where((r) => r.method == method && _route(r) == path)
      .toList();

  static String _route(RequestOptions options) => options.uri.path.replaceFirst(RegExp(r'^/api'), '');

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final key = '${options.method} ${_route(options)}';
    final handler = routes[key];
    final response = handler != null
        ? handler(options)
        : FakeResponse(404, {
            'error': {'code': 'NOT_FOUND', 'message': 'Ruta de prueba no definida: $key'},
          });
    return ResponseBody.fromString(
      jsonEncode(response.body),
      response.status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

/// Datos de prueba con la forma exacta de docs/api-contract.md.
class Fixtures {
  Fixtures._();

  static Map<String, dynamic> user({String role = 'client', String id = 'user-1'}) => {
        'id': id,
        'name': 'Ana Lopez',
        'email': 'ana@example.com',
        'phone': '3001234567',
        'role': role,
        'is_active': true,
      };

  static Map<String, dynamic> service({
    String id = 'svc-1',
    String name = 'Corte Signature',
    int price = 75000,
    int duration = 45,
  }) =>
      {
        'id': id,
        'name': name,
        'description': 'Corte con diagnóstico capilar',
        'duration_minutes': duration,
        'price': price,
        'image_url': null,
        'is_active': true,
      };

  static Map<String, dynamic> combo({String id = 'combo-1', int price = 80000}) => {
        'id': id,
        'name': 'Ritual Imperio',
        'description': 'Corte y barba',
        'services': [service(), service(id: 'svc-2', name: 'Barba', price: 20000, duration: 20)],
        'price': price,
        'duration_minutes': 65,
        'savings': 95000 - price, // corte 75000 + barba 20000
        'image_url': null,
        'is_active': true,
      };

  static Map<String, dynamic> barber({String id = 'barb-1', String name = 'Mateo Silva'}) => {
        'id': id,
        'name': name,
        'phone': '3001112233',
        'avatar_url': null,
        'commission_rate': 0.4,
        'is_active': true,
        'services': [service()],
      };

  /// Un día de prueba a 3 días de hoy (Bogotá), con franjas de 10:00 a 11:00.
  static String futureDate() => isoDate(bogotaToday().add(const Duration(days: 3)));

  static Map<String, dynamic> slot(String date, String hour, {String barberId = 'barb-1'}) => {
        'start': '${date}T$hour:00-05:00',
        'end': '${date}T$hour:45-05:00',
        'barber_id': barberId,
      };

  static Map<String, dynamic> appointment({
    String id = 'cita-1',
    String status = 'confirmed',
    bool canCancel = true,
    String? checkedInAt,
  }) =>
      {
        'id': id,
        'client': {'id': 'user-1', 'name': 'Ana Lopez', 'phone': '3001234567'},
        'barber': {'id': 'barb-1', 'name': 'Mateo Silva'},
        'items': [
          {'name': 'Corte Signature', 'duration_minutes': 45, 'price': 75000},
        ],
        'start': '${futureDate()}T10:00:00-05:00',
        'end': '${futureDate()}T10:45:00-05:00',
        'total_price': 75000,
        'status': status,
        'can_cancel': canCancel,
        'checked_in_at': checkedInAt,
        'commission_amount': null,
        'commission_paid': false,
      };

  static Map<String, dynamic> page(List<Map<String, dynamic>> items) => {
        'items': items,
        'total': items.length,
        'page': 1,
        'page_size': 10,
      };

  static Map<String, dynamic> stats() => {
        'today_appointments': 4,
        'status_counts': {'pending': 1, 'confirmed': 2, 'completed': 1},
        'month_revenue': 1250000,
        'top_services': [
          {'name': 'Corte Signature', 'count': 9},
        ],
        'revenue_by_service': [
          {'name': 'Corte Signature', 'total': 900000},
        ],
        'revenue_by_day': [
          {'date': futureDate(), 'total': 150000},
        ],
        'total_commissions_paid': 300000,
      };
}

/// Prepara la app completa (providers + router real) con la API falsa.
/// `user` simula la sesión activa (respuesta de /auth/me). Sin usuario: invitado.
class TestApp {
  TestApp({required this.adapter, this.sessionUser});

  final FakeAdapter adapter;

  /// JSON de /auth/me (sesión activa). Null = invitado.
  final Map<String, dynamic>? sessionUser;
  late final AuthController auth;

  Future<void> pump(WidgetTester tester, {required String location}) async {
    AppFonts.useGoogleFonts = false;

    // Pantalla alta: así los botones del final de cada flujo están visibles y se pueden tocar.
    tester.view.devicePixelRatio = 1.0;
    tester.view.physicalSize = const Size(800, 2400);
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    if (sessionUser != null) {
      adapter.on('GET', '/auth/me', FakeResponse(200, sessionUser));
    }

    final dio = Dio(BaseOptions(baseUrl: 'http://test/api/'))..httpClientAdapter = adapter;
    final services = AppServices(client: ApiClient(dio: dio));
    auth = AuthController(services);

    await tester.runAsync(() => auth.init());

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<AppServices>.value(value: services),
          ChangeNotifierProvider<AuthController>.value(value: auth),
        ],
        child: MaterialApp.router(
          theme: AppTheme.dark(),
          locale: const Locale('es'),
          supportedLocales: const [Locale('es')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          routerConfig: appRouter,
        ),
      ),
    );

    appRouter.go(location);
    await settle(tester);
  }

  /// Deja correr los futures de la API falsa y las animaciones (los spinners no terminan nunca).
  static Future<void> settle(WidgetTester tester, {int rounds = 40}) async {
    for (var i = 0; i < rounds; i++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 5)));
      await tester.pump(const Duration(milliseconds: 50));
    }
  }
}

/// Formato de fechas en español, igual que en main.dart. Llamar en setUpAll.
Future<void> setUpLocale() => initializeDateFormatting('es_CO');

/// Ruta actual del router (para comprobar redirecciones).
String currentLocation() => appRouter.routerDelegate.currentConfiguration.uri.path;

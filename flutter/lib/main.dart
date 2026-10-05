import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/theme.dart';
import 'data/app_services.dart';
import 'router.dart';
import 'state/auth_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es_CO');

  final services = AppServices(client: await ApiClient.create());
  final auth = AuthController(services);

  runApp(
    MultiProvider(
      providers: [
        Provider<AppServices>.value(value: services),
        ChangeNotifierProvider<AuthController>.value(value: auth),
      ],
      child: const ImperioApp(),
    ),
  );

  // Revisa si ya existe una sesión (cookie) llamando a /auth/me.
  auth.init();
}

class ImperioApp extends StatelessWidget {
  const ImperioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Imperio Barber | Barbería de Autor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      locale: const Locale('es'),
      supportedLocales: const [Locale('es')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: appRouter,
    );
  }
}

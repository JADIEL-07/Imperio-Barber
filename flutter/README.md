# Imperio Barber – Frontend Flutter

Nuevo frontend en Flutter (web y móvil) que replica las pantallas de `web/` (Next.js) con el mismo
diseño y las mismas reglas de negocio. Consume la misma API del backend de microservicios.

- **Producción (web):** https://flutter.imperio.newonline.digital (servicio `flutter-web` detrás del gateway).
- **Frontend anterior:** `web/` (Next.js) sigue en `imperio.newonline.digital`, sin cambios.

## Estructura

```
lib/
  core/       cliente HTTP (cookies), formato (COP, fechas Bogotá), tema (colores de tailwind.config.ts)
  models/     modelos según docs/api-contract.md
  data/       AppServices: todos los endpoints (auth, catalog, booking)
  state/      AuthController (sesión, igual que AuthContext.tsx)
  shell/      barra superior, menú, pie de página, guardas por rol, navegación admin
  ui/         widgets compartidos (botones, paneles, estados de carga/error, diálogos)
  features/   pantallas: public, auth, client, barber, admin
  router.dart rutas con los mismos paths que web/src/app
```

## Rutas

| Ruta | Rol | Equivalente web |
|---|---|---|
| `/`, `/servicios`, `/combos` | público | `(public)/page.tsx`, `servicios`, `combos` |
| `/login`, `/registro` | público | `(public)/login`, `registro` |
| `/reservar`, `/mis-citas`, `/perfil` | cliente | `(cliente)/*` |
| `/empleado/agenda`, `/empleado/disponibilidad` | barbero | `(empleado)/*` |
| `/admin`, `/admin/usuarios`, `/admin/empleados`, `/admin/servicios`, `/admin/combos`, `/admin/citas`, `/admin/configuracion` | admin | `(admin)/*` |

## Sesión y API

- En **web** la API se llama en `/api` (mismo origen que el dominio). La cookie `session_token`
  la maneja el navegador, igual que en Next.js.
- En **móvil** la URL base se define al compilar:
  ```bash
  flutter run --dart-define=API_BASE_URL=https://flutter.imperio.newonline.digital/api
  ```
  En el emulador de Android usa `http://10.0.2.2:<puerto>/api`.

## Android

La carpeta `android/` se generó desde las plantillas oficiales de Flutter (Gradle 9.3.1, AGP 9.1.0,
Kotlin 2.4.0), con estos cambios propios:

- Permiso `INTERNET` en el manifiesto principal (en la plantilla solo estaba en debug).
- Splash y ventana con el fondo oscuro de la marca (`#111317`).
- Icono adaptativo: estrella dorada sobre fondo oscuro (vector, sin PNG). En Android < 8 se sigue
  viendo el icono por defecto de Flutter; para esos casos hay que añadir los `mipmap-*/ic_launcher.png`.
- Sesión persistente: las cookies se guardan en disco (`PersistCookieJar`), así no hay que volver a
  iniciar sesión al reabrir la app.
- Applicationid: `com.imperiobarber.app`.

Compilar:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://flutter.imperio.newonline.digital/api
```

Antes de publicar en Google Play: el build release usa la firma de debug (ver
`android/app/build.gradle.kts`) y hay que crear un keystore propio.

## Desarrollo

```bash
cd flutter
flutter pub get
flutter analyze
flutter run -d chrome --dart-define=API_BASE_URL=https://flutter.imperio.newonline.digital/api
```

## Despliegue

`docker-compose.yml` define el servicio `flutter-web`: compila el build con `flutter build web`
(`Dockerfile` de varias etapas) y lo sirve con nginx (`nginx.conf`). El gateway enruta
`flutter.imperio.newonline.digital` hacia ese servicio y mantiene la API en el mismo origen (`/api/*`),
así que no hace falta CORS para este frontend.

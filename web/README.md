# Imperio Barber - Web Frontend

Frontend desarrollado con **Next.js 14 (App Router)**, **TypeScript** y **Tailwind CSS**, conectado 100% al backend real (sin mocks) para la plataforma de barbería Imperio Barber.

El sistema de diseño ("Imperio Barber": oro/obsidiana, tipografías Outfit / Hanken Grotesk / JetBrains Mono) está definido en `tailwind.config.ts` usando tokens Material Design 3 (`surface`, `primary-container`, `on-surface`, etc.) — para cambiar la paleta de marca, basta con editar los valores de color ahí; ningún componente tiene colores quemados.

---

## 🚀 Inicio Rápido

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Ejecutar en desarrollo
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000). Necesita los 3 microservicios backend corriendo (ver `docker-compose.yml` en la raíz del repo) — no hay modo de mocks, toda vista llama a la API real.

### 3. Variables de entorno
```bash
NEXT_PUBLIC_API_URL=/api   # o la URL absoluta del backend si está en otro dominio
```

---

## 🧭 Estructura de Rutas y Vistas

Rutas reales (los paréntesis son grupos de organización de Next.js y no aparecen en la URL):

```text
src/app/
├── layout.tsx                        # Header + Footer globales + AuthProvider
├── (public)/
│   ├── page.tsx                      # /            Inicio: hero, servicios/combos destacados, horario y ubicación
│   ├── servicios/page.tsx            # /servicios   Catálogo completo de servicios
│   ├── combos/page.tsx               # /combos      Catálogo de combos con ahorro
│   ├── login/page.tsx                # /login
│   └── registro/page.tsx             # /registro
├── (cliente)/  — requiere sesión con rol "client" (RouteGuard)
│   ├── layout.tsx
│   ├── reservar/page.tsx             # /reservar    Asistente de 4 pasos (servicios o combo, barbero, fecha real, confirmación)
│   ├── mis-citas/page.tsx            # /mis-citas   Próximas/Historial + boleto QR con self-check-in
│   └── perfil/page.tsx               # /perfil
├── (empleado)/ — requiere sesión con rol "employee"
│   ├── layout.tsx
│   └── empleado/
│       ├── agenda/page.tsx           # /empleado/agenda          Vista día/semana, cambio de estado, check-in manual
│       └── disponibilidad/page.tsx   # /empleado/disponibilidad  Horario semanal + bloqueos
└── (admin)/ — requiere sesión con rol "admin"
    ├── layout.tsx
    └── admin/
        ├── page.tsx                  # /admin                 Dashboard: KPIs, ingresos por día y por servicio, comisiones pagadas
        ├── usuarios/page.tsx         # /admin/usuarios        Tabla + filtros + CRUD de roles
        ├── empleados/page.tsx        # /admin/empleados       Foto, horario, tarifa y pago de comisiones por barbero
        ├── servicios/page.tsx        # /admin/servicios       CRUD de servicios (con imagen)
        ├── combos/page.tsx           # /admin/combos          CRUD de combos (con imagen; alerta si precio > suma)
        ├── citas/page.tsx            # /admin/citas           Todas las citas, filtros, cambio de estado, comisión por cita
        └── configuracion/page.tsx    # /admin/configuracion   Horario general, cancelación, franjas
```

La protección de rutas (`src/components/auth/RouteGuard.tsx`) es solo de UX: redirige a `/login` o a `/` cuando no hay sesión o el rol no corresponde. El backend es quien aplica los permisos reales (401/403).

---

## 🎟️ Funcionalidades agregadas sobre el brief original

Estas tres se construyeron con backend real (no son solo visuales) a pedido explícito, inspiradas en un mockup de diseño que las proponía:

1. **Check-in con QR** (`components/booking/AppointmentTicket.tsx`, visible en `/mis-citas`): cada cita próxima muestra un "boleto" con código QR (codifica `IMPERIO-CHECKIN:<id>`, no hay escáner externo construido todavía) y un botón "Avisar que ya llegué" que llama a `POST /bookings/appointments/{id}/check-in`. El personal también puede marcar el check-in manualmente desde `/empleado/agenda`.
2. **Comisiones de barberos** (`/admin/empleados`): cada barbero tiene una tarifa de comisión (%) editable; al completar una cita se calcula y congela el monto de comisión con la tarifa vigente en ese momento. El admin ve pendiente/pagado histórico y puede registrar el pago (`.../commissions/payout`).
3. **Ingresos por día y por servicio** (`/admin`): el dashboard ahora grafica ingresos reales agrupados por día (barras) y por servicio (barras horizontales), más el fondo total de comisiones pagadas — antes esto eran datos quemados en el backend (`top_services` tenía nombres de ejemplo hardcodeados).

---

## 📐 Reglas, Supuestos y Decisiones de Implementación

1. **Contrato de API Estricto:** Toda comunicación HTTP se realiza exclusivamente a través de los módulos en `src/lib/api/` (`auth.ts`, `catalog.ts`, `booking.ts`). Ningún componente realiza llamadas `fetch` directas.
2. **Sesión Segura:** Se utiliza `credentials: "include"`. La sesión se almacena en una cookie `httpOnly` emitida por el backend (`session_token`). El frontend nunca almacena tokens en `localStorage`. El estado de sesión vive en `src/lib/auth/AuthContext.tsx`, que llama a `GET /auth/me` al cargar la app.
3. **Moneda y Fechas:** Precios manejados como enteros en pesos colombianos (`COP`) y fechas en `America/Bogota`, centralizados en `src/lib/format.ts`.
4. **Política de Cancelación:** El frontend confía en el campo `can_cancel` que ya calcula el backend por cita; no reimplementa la regla de las 2 horas.
5. **Combos y Duración:** La duración, el ahorro y la validación de precio de un combo las calcula el backend; el formulario de `/admin/combos` solo muestra una advertencia en vivo si el precio ingresado supera la suma de los servicios seleccionados.
6. **Reservar solo usuarios registrados:** `/reservar`, `/mis-citas` y `/perfil` exigen rol `client`.
7. **Identidad barbero = usuario empleado:** `booking_service.py` trata `barber_id` como el `id` del usuario con rol `employee` (`scope="barber" → barber_id = current_user.id`). Por eso `/empleado/disponibilidad` usa `user.id` directamente como `barberId`. **Nota real encontrada durante el desarrollo:** los "barberos" que devuelve `GET /bookings/barbers` hoy son 3 registros sembrados a mano en el backend (`Mateo Silva`, etc.), sin sincronización real con los usuarios rol `employee` creados en `/admin/usuarios` — son tablas separadas en microservicios separados. Las fotos, horarios y comisiones se gestionan sobre esos registros de `barbers`, que es el único concepto de "barbero" que expone la API.
8. **Editor de horario reutilizado:** `src/components/scheduling/ScheduleManager.tsx` implementa el horario semanal + bloqueos una sola vez y lo usan tanto `/empleado/disponibilidad` como `/admin/empleados`.
9. **Filtros de `/admin/citas`:** El contrato de `GET /bookings/appointments` no define `barber_id` ni filtro de cliente como query params. El filtro por barbero y por cliente se aplica en el cliente sobre el resultado ya paginado (`scope=all`, `page_size=200`).
10. **Registro + inicio de sesión automático:** `POST /auth/register` no abre sesión. Tras un registro exitoso, `/registro` llama inmediatamente a `authApi.login`.
11. **Reservar y reprogramar con disponibilidad real:** tanto `/reservar` como el modal de reprogramar llaman a `GET /bookings/availability` con la fecha, el barbero y la duración real seleccionada, y solo permiten elegir una franja que el backend reporta libre. Si al confirmar la franja ya se ocupó (409), se recarga la disponibilidad y se muestra el error. **Corrección importante encontrada:** el endpoint `POST /bookings/appointments` ignoraba por completo `service_ids`/`combo_id` y grababa siempre los mismos dos servicios de ejemplo con precio fijo; se corrigió para que `booking` resuelva los IDs reales contra el microservicio `catalog` por HTTP antes de crear la cita.
12. **Sin mocks:** a diferencia de una versión anterior, este frontend no tiene capa de datos simulados (`NEXT_PUBLIC_USE_MOCKS`) — siempre llama al backend real. Si se necesita desarrollar sin backend levantado, hay que levantar los 3 microservicios con Docker Compose.

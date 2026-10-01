# Imperio Barber - Web Frontend

Frontend moderno desarrollado con **Next.js 14 (App Router)**, **TypeScript** y **Tailwind CSS** para la plataforma de barbería de autor Imperio Barber.

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
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🎛️ Alternar entre Mocks y API Real

El frontend cuenta con una capa de abstracción desacoplada en `src/lib/api/` y datos simulados tipados en `src/lib/mocks/`.

Para cambiar de modo, ajusta la variable en tu archivo `.env.local`:

```bash
# Modo desarrollo con datos simulados (sin levantar backend)
NEXT_PUBLIC_USE_MOCKS=true

# Modo integrado con microservicios / Gateway
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api
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
│   ├── reservar/page.tsx             # /reservar    Asistente de 4 pasos
│   ├── mis-citas/page.tsx            # /mis-citas   Próximas/Historial, reprogramar y cancelar
│   └── perfil/page.tsx               # /perfil
├── (empleado)/ — requiere sesión con rol "employee"
│   ├── layout.tsx
│   └── empleado/
│       ├── agenda/page.tsx           # /empleado/agenda          Vista día/semana + cambio de estado
│       └── disponibilidad/page.tsx   # /empleado/disponibilidad  Horario semanal + bloqueos
└── (admin)/ — requiere sesión con rol "admin"
    ├── layout.tsx
    └── admin/
        ├── page.tsx                  # /admin                 Dashboard (bookingApi.getStats)
        ├── usuarios/page.tsx         # /admin/usuarios        Tabla + filtros + CRUD de roles
        ├── empleados/page.tsx        # /admin/empleados       Barberos, sus servicios y su horario
        ├── servicios/page.tsx        # /admin/servicios       CRUD de servicios
        ├── combos/page.tsx           # /admin/combos          CRUD de combos (alerta si precio > suma)
        ├── citas/page.tsx            # /admin/citas           Todas las citas, filtros, cambio de estado
        └── configuracion/page.tsx    # /admin/configuracion   Horario general, cancelación, franjas
```

La protección de rutas (`src/components/auth/RouteGuard.tsx`) es solo de UX: redirige a `/login` o a `/` cuando no hay sesión o el rol no corresponde. El backend es quien aplica los permisos reales (401/403); si cambia ahí, aquí no hay nada más que ajustar.

---

## 📐 Reglas, Supuestos y Decisiones de Implementación

1. **Contrato de API Estricto:** Toda comunicación HTTP se realiza exclusivamente a través de los módulos en `src/lib/api/` (`auth.ts`, `catalog.ts`, `booking.ts`). Ningún componente realiza llamadas `fetch` directas.
2. **Sesión Segura:** Se utiliza `credentials: "include"`. La sesión se almacena en una cookie `httpOnly` emitida por el backend (`session_token`). El frontend nunca almacena tokens en `localStorage`. El estado de sesión vive en `src/lib/auth/AuthContext.tsx`, que llama a `GET /auth/me` al cargar la app.
3. **Moneda y Fechas:** Precios manejados como enteros en pesos colombianos (`COP`) y fechas en `America/Bogota`, centralizados en `src/lib/format.ts` (`formatCOP`, `formatDateBogota`, `formatTimeBogota`, etc.) para no repetir `Intl.NumberFormat`/`Intl.DateTimeFormat` en cada vista.
4. **Política de Cancelación:** El frontend confía en el campo `can_cancel` que ya calcula el backend por cita; no reimplementa la regla de las 2 horas. Se usa tanto para bloquear "Cancelar" como "Reprogramar" en `/mis-citas`.
5. **Combos y Duración:** La duración y el ahorro de un combo los calcula el backend (`duration_minutes`, `savings`); el formulario de `/admin/combos` solo muestra una advertencia en vivo si el precio ingresado supera la suma de los servicios seleccionados, antes de enviar el formulario.
6. **Reservar solo usuarios registrados:** `/reservar`, `/mis-citas` y `/perfil` exigen rol `client`. Un `employee` o `admin` autenticado que entra a esas rutas es redirigido a su propio panel (no hay flujo de "reservar para mí mismo" en esos roles, ya que el brief no lo contempla).
7. **Identidad barbero = usuario empleado:** El backend trata `barber_id` como el `id` del usuario con rol `employee` (confirmado en `booking_service.py`, `scope="barber" → barber_id = current_user.id`). Por eso `/empleado/disponibilidad` usa `user.id` del `AuthContext` directamente como `barberId`, sin un endpoint adicional de "mi perfil de barbero".
8. **Editor de horario reutilizado:** `src/components/scheduling/ScheduleManager.tsx` implementa el horario semanal + bloqueos una sola vez y lo usan tanto `/empleado/disponibilidad` (barbero edita el suyo) como `/admin/empleados` (admin edita el de cualquiera), evitando duplicar la lógica de `GET/PUT /bookings/barbers/{id}/schedule` y `time-off`.
9. **Filtros de `/admin/citas`:** El contrato de `GET /bookings/appointments` solo define `scope`, `status`, `from`, `to` y paginación — no `barber_id` ni filtro de cliente. Para no inventar parámetros fuera del contrato, el filtro por barbero y por cliente se aplica en el cliente sobre el resultado ya paginado (`scope=all`, `page_size=200`). Si el volumen de citas crece mucho, convendría pedir al backend esos filtros nativamente.
10. **Registro + inicio de sesión automático:** `POST /auth/register` no abre sesión (no pone cookie). Tras un registro exitoso, `/registro` llama inmediatamente a `authApi.login` con las mismas credenciales para no obligar al cliente a loguearse dos veces.
11. **Reprogramar con disponibilidad real:** El modal de reprogramar (`RescheduleAppointmentModal`) no inventa horarios: llama a `GET /bookings/availability` con la fecha elegida, el `barber_id` y la duración real de la cita, y solo permite elegir una franja que el backend reporta libre. Si al confirmar la franja ya se ocupó (409), se recarga la disponibilidad y se muestra el error, igual que en `/reservar`.

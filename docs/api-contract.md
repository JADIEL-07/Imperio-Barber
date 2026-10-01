# Contrato de API - Imperio Barber

Este documento define el contrato formal e inmutable entre el backend de microservicios y el frontend.

## 1. Convenciones Generales
- **Base Path:** `/api`
- **Formato:** JSON estricto en formato `snake_case`.
- **Precios:** Enteros en pesos colombianos (COP), sin decimales (ej. `75000` para COP $75.000).
- **Zona Horaria:** `America/Bogota` (UTC-5), cadenas en formato ISO 8601 (ej. `"2026-10-05T15:30:00-05:00"`).
- **Sesión:** Basada en cookie `httpOnly` llamada `session_token` enviada con `credentials: "include"`. El frontend no manipula tokens en `localStorage`.
- **Formato Estándar de Errores:**
  ```json
  {
    "error": {
      "code": "BAD_REQUEST",
      "message": "Descripción clara del error"
    }
  }
  ```
- **Formato Estándar de Paginación:**
  ```json
  {
    "items": [],
    "total": 0,
    "page": 1,
    "page_size": 20
  }
  ```

---

## 2. Microservicio Auth (`/api/auth`)

### Modelos
- `User`: `{ id: string, name: string, email: string, phone: string, role: "admin" | "employee" | "client", is_active: boolean }`

### Endpoints
| Método | Ruta | Descripción | Payload | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/register` | Registro de clientes | `{ name, email, phone, password }` | `User` |
| POST | `/api/auth/login` | Inicio de sesión (asigna cookie httpOnly) | `{ email, password }` | `User` |
| POST | `/api/auth/logout` | Cierre de sesión (expira cookie) | - | `204 No Content` |
| GET | `/api/auth/me` | Obtener usuario autenticado | - | `User` |
| PATCH | `/api/auth/me` | Actualizar perfil propio | `{ name?, phone?, password? }` | `User` |
| GET | `/api/auth/users` | Listado paginado de usuarios (Admin) | Query: `?role=&search=&page=&page_size=` | `PageResponse<User>` |
| POST | `/api/auth/users` | Crear usuario con rol asignado (Admin) | `{ name, email, phone, password, role }` | `User` |
| PATCH | `/api/auth/users/{id}` | Modificar estado o rol de usuario (Admin) | `{ name?, phone?, role?, is_active? }` | `User` |

---

## 3. Microservicio Catalog (`/api/catalog`)

### Modelos
- `Service`: `{ id: string, name: string, description: string, duration_minutes: integer, price: integer, image_url: string | null, is_active: boolean }`
- `Combo`: `{ id: string, name: string, description: string, services: Service[], price: integer, duration_minutes: integer, savings: integer, image_url: string | null, is_active: boolean }`

`image_url` es una URL simple que el admin pega (no hay subida de archivos); puede ser `null` si no se definió.

### Endpoints
| Método | Ruta | Descripción | Payload | Respuesta |
|---|---|---|---|---|
| GET | `/api/catalog/services` | Listar servicios activos (o todos si es admin) | Query: `?all=true` | `Service[]` |
| POST | `/api/catalog/services` | Crear servicio (Admin) | `{ name, description, duration_minutes, price, image_url?, is_active }` | `Service` |
| PATCH | `/api/catalog/services/{id}` | Modificar servicio (Admin) | `{ name?, description?, duration_minutes?, price?, image_url?, is_active? }` | `Service` |
| GET | `/api/catalog/combos` | Listar combos con cálculo de duración y ahorro | Query: `?all=true` | `Combo[]` |
| POST | `/api/catalog/combos` | Crear combo (Admin) | `{ name, description, service_ids: string[], price, image_url?, is_active }` | `Combo` |
| PATCH | `/api/catalog/combos/{id}` | Modificar combo (Admin) | `{ name?, description?, service_ids?, price?, image_url?, is_active? }` | `Combo` |

---

## 4. Microservicio Booking (`/api/bookings`)

### Modelos
- `Barber`: `{ id: string, name: string, phone: string, avatar_url: string | null, commission_rate: number (0.0-1.0), services: Service[], is_active: boolean }`
- `Slot`: `{ start: string, end: string, barber_id: string }`
- `AppointmentItem`: `{ name: string, duration_minutes: integer, price: integer }`
- `Appointment`:
  ```json
  {
    "id": "string",
    "client": { "id": "string", "name": "string", "phone": "string" },
    "barber": { "id": "string", "name": "string" },
    "items": [{ "name": "string", "duration_minutes": 45, "price": 75000 }],
    "start": "2026-10-24T11:15:00-05:00",
    "end": "2026-10-24T12:40:00-05:00",
    "total_price": 135000,
    "status": "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
    "can_cancel": true,
    "checked_in_at": "2026-10-24T11:10:00-05:00 | null",
    "commission_amount": "integer | null (se calcula solo al pasar a completed)",
    "commission_paid": false
  }
  ```
- `CommissionSummary`: `{ barber_id, barber_name, commission_rate, pending_amount: integer, pending_count: integer, paid_amount: integer }`
- `CommissionPayout`: `{ id, barber_id, amount: integer, appointments_count: integer, created_at: string }`

### Endpoints
| Método | Ruta | Descripción | Payload / Query | Respuesta |
|---|---|---|---|---|
| GET | `/api/bookings/barbers` | Listar barberos con servicios que realizan | - | `Barber[]` |
| PATCH | `/api/bookings/barbers/{id}` | Modificar perfil del barbero (Admin) | `{ name?, phone?, avatar_url?, commission_rate?, is_active? }` | `Barber` |
| GET | `/api/bookings/availability` | Calcular turnos libres según fecha y servicios | Query: `?barber_id=&date=YYYY-MM-DD&service_ids=&combo_id=` | `{ "slots": Slot[] }` |
| POST | `/api/bookings/appointments` | Agendar cita (retorna 409 si la franja fue ocupada, 404 si el servicio/combo no existe) | `{ barber_id?: string, start: string, service_ids?: string[], combo_id?: string }` | `Appointment` |
| GET | `/api/bookings/appointments` | Listar citas según rol y filtros | Query: `?scope=mine\|barber\|all&status=&from=&to=&page=&page_size=` | `PageResponse<Appointment>` |
| PATCH | `/api/bookings/appointments/{id}` | Actualizar estado o reprogramar horario | `{ status?: string, start?: string }` | `Appointment` |
| POST | `/api/bookings/appointments/{id}/check-in` | Check-in (boleto QR): el propio cliente o el personal marcan la llegada | - | `Appointment` |
| GET | `/api/bookings/barbers/{id}/schedule` | Obtener horario semanal del barbero | - | `[{ weekday: 0-6, start: "HH:MM", end: "HH:MM" }]` |
| PUT | `/api/bookings/barbers/{id}/schedule` | Actualizar horario semanal | `[{ weekday: 0-6, start: "HH:MM", end: "HH:MM" }]` | `Schedule[]` |
| GET | `/api/bookings/barbers/{id}/time-off` | Listar bloqueos y vacaciones | - | `[{ id, from, to, reason }]` |
| POST | `/api/bookings/barbers/{id}/time-off` | Crear bloqueo puntual | `{ from, to, reason }` | `TimeOff` |
| DELETE | `/api/bookings/barbers/{id}/time-off/{time_off_id}` | Eliminar bloqueo | - | `204 No Content` |
| GET | `/api/bookings/barbers/{id}/commissions` | Resumen de comisiones pendientes/pagadas (Admin) | - | `CommissionSummary` |
| POST | `/api/bookings/barbers/{id}/commissions/payout` | Pagar todas las comisiones pendientes del barbero (Admin); 422 si no hay nada pendiente | - | `CommissionPayout` |
| GET | `/api/bookings/settings` | Obtener configuración del negocio | - | `{ opening_hours, cancel_min_hours: 2, slot_minutes: 15 }` |
| PUT | `/api/bookings/settings` | Actualizar configuración (Admin) | `{ opening_hours?, cancel_min_hours?, slot_minutes? }` | `Settings` |
| GET | `/api/bookings/stats` | Métricas de dashboard (Admin) | - | `{ today_appointments, status_counts, month_revenue, top_services, revenue_by_service, revenue_by_day, total_commissions_paid }` |

**Nota sobre check-in:** no requiere escanear nada en el backend - el QR en el frontend simplemente codifica el `id` de la cita; tanto el cliente dueño de la cita como cualquier `employee`/`admin` pueden llamar este endpoint (por ejemplo, el barbero lo hace manualmente desde su agenda si el cliente no usa el QR). Solo aplica a citas en `pending`/`confirmed` sin check-in previo.

**Nota sobre comisiones:** `commission_amount` se calcula y congela (snapshot) con la `commission_rate` vigente del barbero en el momento exacto en que la cita pasa a `completed` - cambios posteriores a la tarifa no alteran comisiones ya calculadas. `commission_paid` se pone en `true` para todas las citas incluidas al llamar a `.../commissions/payout`, que además crea un registro histórico (`CommissionPayout`) usado para `total_commissions_paid` en `/stats`.

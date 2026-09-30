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

```text
src/app/
├── (public)/
│   ├── page.tsx            # Inicio: Hero, carta de servicios, combos, maestros y reservas
│   ├── servicios/          # Catálogo completo de servicios individuales
│   ├── combos/             # Catálogo de combos con desglose de servicios y ahorro
│   ├── login/              # Formulario de inicio de sesión con cookie httpOnly
│   └── registro/           # Registro de nuevos clientes
├── (cliente)/
│   ├── reservar/           # Asistente de 4 pasos (Servicios -> Barbero -> Fecha/Hora -> Confirmación)
│   ├── mis-citas/          # Portal privado: Citas próximas e historial con reprogramación y cancelación
│   └── perfil/             # Edición de datos personales y teléfono
├── (empleado)/
│   ├── agenda/             # Vista diaria y semanal de turnos para el barbero
│   └── disponibilidad/     # Configuración de horarios y bloqueos de vacaciones
└── (admin)/
    ├── dashboard/          # Métricas de ingresos del mes, citas del día y servicios top
    ├── usuarios/           # Gestión y asignación de roles (admin, employee, client)
    ├── empleados/          # Catálogo de barberos y asignación de servicios
    ├── servicios/          # CRUD de servicios individuales
    ├── combos/             # CRUD de combos con cálculo de duración y ahorro
    ├── citas/              # Visualización global y cambio de estados
    └── configuracion/      # Horario general de apertura, política de cancelación y franjas
```

---

## 📐 Reglas y Supuestos de Arquitectura

1. **Contrato de API Estricto:** Toda comunicación HTTP se realiza exclusivamente a través de los módulos en `src/lib/api/` (`auth.ts`, `catalog.ts`, `booking.ts`). Ningún componente realiza llamadas `fetch` directas.
2. **Sesión Segura:** Se utiliza `credentials: "include"`. La sesión se almacena en una cookie `httpOnly` emitida por el backend (`session_token`). El frontend nunca almacena tokens en `localStorage`.
3. **Moneda y Fechas:** Precios manejados como enteros en pesos colombianos (`COP`), formateados mediante `Intl.NumberFormat("es-CO", {style:"currency", currency:"COP", maximumFractionDigits:0})`. Fechas procesadas en zona horaria `America/Bogota` (UTC-5).
4. **Política de Cancelación:** Cancelación sin recargo permitida hasta 2 horas antes del inicio de la cita (`can_cancel: boolean`).
5. **Combos y Duración:** La duración de un combo equivale a la suma de las duraciones de sus servicios incluidos.

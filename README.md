# Imperio Barber

Plataforma de gestión y reservas para barbería desarrollada bajo arquitectura de microservicios.

## 🏗️ Estructura del Monorepo

```text
Imperio-Barber/
├── Makefile                    # make test, make up, make lint, make format, make clean
├── docker-compose.yml          # orquestación local (postgres, gateway, auth, catalog, booking)
├── docker-compose.test.yml     # entorno de pruebas automatizadas
├── .env.example                # plantilla de configuración
├── pyproject.toml              # configuración global de Ruff y Pytest
├── docs/
│   ├── api-contract.md         # contrato formal e inmutable de API
│   ├── architecture.md         # diseño arquitectónico
│   └── adr/                    # registros de decisiones arquitectónicas
├── infra/
│   ├── gateway/nginx.conf      # proxy inverso (/api/auth, /api/catalog, /api/bookings)
│   └── postgres/init/          # inicialización de auth_db, catalog_db, booking_db
├── libs/
│   └── common/                 # logging estructurado, excepciones estándar, seguridad y sesiones
├── services/
│   ├── auth/                   # usuarios, roles (admin, employee, client), login y sesión httpOnly
│   ├── catalog/                # servicios individuales (corte, barba...) y combos
│   └── booking/                # citas, disponibilidad, horarios de barberos y métricas
├── web/                        # aplicación web frontend (Next.js 14, TypeScript, Tailwind)
├── tests/
│   └── e2e/                    # pruebas end-to-end entre microservicios
└── scripts/                    # utilidades de mantenimiento y seeders
```

## 🛠️ Microservicios

1. **Auth Service (`/api/auth`)**:
   - Registro y login con cookie segura `httpOnly`.
   - Control de roles (`admin`, `employee`, `client`).
   - Gestión y administración de usuarios.

2. **Catalog Service (`/api/catalog`)**:
   - Catálogo de servicios individuales (duración, precio COP).
   - Gestión de combos con cálculo automático de duración acumulada y ahorro.

3. **Booking Service (`/api/bookings`)**:
   - Motor de cálculo de franjas horarias y disponibilidad sin solapamientos.
   - Agendamiento con protección de concurrencia (Error 409).
   - Horarios semanales y bloqueos de vacaciones por barbero.
   - Reprogramación y cancelación (hasta 2 horas antes).
   - Dashboard de estadísticas para administración.

## 🚀 Comandos Rápidos

```bash
# Levantar el entorno completo en local con Docker Compose
make up

# Detener los contenedores
make down

# Ejecutar la suite de pruebas unitarias y de contrato (FastAPI + Pytest)
make test

# Ejecutar linters (Ruff)
make lint

# Formatear código
make format
```

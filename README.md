# Imperio Barber

Plataforma de gestión y reservas para barbería desarrollada bajo arquitectura de microservicios.

## 🏗️ Estructura del Monorepo

```text
Imperio-Barber/
├── Makefile                    # make test, make lint, make format, make clean
├── .env.example                # plantilla de configuración
├── pyproject.toml              # configuración global de Ruff y Pytest
├── docs/
│   ├── api-contract.md         # contrato formal e inmutable de API
│   ├── architecture.md         # diseño arquitectónico
│   └── adr/                    # registros de decisiones arquitectónicas
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
# Ejecutar la suite de pruebas unitarias y de contrato (FastAPI + Pytest)
make test

# Ejecutar linters (Ruff)
make lint

# Formatear código
make format
```

> ⚠️ El despliegue en contenedores (Docker Compose, Dockerfiles por servicio, gateway nginx) se
> retiró del repositorio para rehacerlo desde cero. Hasta que se agregue de nuevo, cada
> microservicio se corre localmente con `uvicorn` (ver su propio `pyproject.toml`) y el frontend
> con `npm run dev` dentro de `web/`.

# Imperio Barber

Plataforma de gestión y reservas para barbería desarrollada bajo arquitectura de microservicios.

## 🏗️ Estructura del Monorepo

```text
Imperio-Barber/
├── Makefile                    # make test, make up, make lint, make format, make clean
├── docker-compose.yml          # orquestación local/producción (postgres, gateway, auth, catalog, booking, web)
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

## 🐳 Despliegue con Docker

Cinco contenedores, sin puertos publicados al host (pensado para desplegar detrás de un proxy
externo como Traefik/Coolify, que debe apuntar al servicio `gateway`, puerto `80`):

| Servicio          | Rol                                                              |
|-------------------|-------------------------------------------------------------------|
| `postgres`        | Una sola instancia; `infra/postgres/init` crea `auth_db`, `catalog_db`, `booking_db` |
| `auth-service`    | FastAPI, puerto interno 8000; healthcheck en `GET /health`         |
| `catalog-service` | FastAPI, puerto interno 8000; healthcheck en `GET /health`         |
| `booking-service` | FastAPI, puerto interno 8000; depende de que auth y catalog estén `healthy` |
| `web`             | Next.js standalone, puerto interno 3000                           |
| `gateway`         | nginx; único contenedor expuesto. Reparte `/api/auth`→auth, `/api/catalog`→catalog, `/api/bookings`→booking, resto→web |

Pasos (un solo dominio):

1. Copia `.env.production.example` a `.env` y ajusta `POSTGRES_PASSWORD` y `SESSION_SECRET`.
2. `docker compose build && docker compose up -d` (o `make deploy` para forzar rebuild sin caché).
3. Configura tu proxy/Coolify para enrutar el dominio público al contenedor `gateway`, puerto `80`.
4. Verifica `GET /health` a través del gateway antes de validar las rutas de la app.

### Variante: frontend y backend en dominios distintos

También se puede desplegar con dos dominios (ej. `app.tudominio.com` para el frontend y
`api.tudominio.com` para el backend). Esto exige que la cookie de sesión y el CORS viajen
cross-site, así que hay soporte explícito para ello en el código:

- `libs/common/security.py`: en `ENVIRONMENT=production` la cookie de sesión se pone con
  `SameSite=None; Secure` (en vez de `Lax`) para que el navegador la mande entre dominios
  distintos. Requiere HTTPS en ambos dominios (Coolify + Let's Encrypt ya lo da).
- Cada microservicio (`auth`, `catalog`, `booking`) lee `CORS_ORIGINS` (lista separada por
  comas) para `allow_origins` del `CORSMiddleware`, en vez de tener `localhost` fijo.

Pasos adicionales para esta variante:

1. Domain A (frontend) → servicio **`web`**, puerto `3000`.
2. Domain B (backend) → servicio **`gateway`**, puerto `80` (sigue siendo el único que sabe
   repartir entre `auth-service`/`catalog-service`/`booking-service`; visitar la raíz `/` de
   este dominio seguirá sirviendo el frontend también — es inofensivo, solo cosmético).
3. En las variables de entorno:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.tudominio.com/api   # URL absoluta, no relativa
   CORS_ORIGINS=https://app.tudominio.com              # origen exacto del frontend, sin / final
   ```
4. Si cambias `NEXT_PUBLIC_API_URL` después de un primer deploy, hay que forzar rebuild de la
   imagen `web` (es un `ARG` de build, no una variable de runtime).

⚠️ Riesgo a tener en cuenta: algunos navegadores (Safari con ITP, y Chrome a futuro) restringen
cookies "de terceros" aunque tengan `SameSite=None; Secure`, si los dos dominios no están
relacionados. Es más confiable usar subdominios de un mismo dominio raíz (`app.midominio.com` /
`api.midominio.com`) que dos dominios completamente distintos.

# Imperio Barber

Plataforma de gestión para barbería desarrollada con arquitectura de microservicios.

## Estructura del Proyecto

```
.
├── Makefile                    # make test, make up, make lint (un solo punto de entrada)
├── docker-compose.yml          # levanta todo en local
├── docker-compose.test.yml     # BD y dependencias solo para pruebas
├── .env.example                # variables de entorno de ejemplo
├── pyproject.toml              # ruff + config global de pytest (markers)
├── docs/
│   ├── architecture.md
│   └── adr/                    # decisiones de arquitectura (ADRs)
├── infra/
│   ├── gateway/                # gateway / proxy inverso (Nginx / Traefik)
│   └── postgres/init/          # scripts de inicialización de bases de datos por servicio
├── libs/
│   └── common/                 # logging, errores estándar, utilidades JWT compartidas
├── services/
│   ├── auth/                   # Servicio de autenticación
│   ├── users/                  # Servicio de gestión de usuarios / barberos / clientes
│   └── orders/                 # Servicio de reservas / pedidos / servicios
├── web/                        # Frontend (Next.js + Tailwind CSS)
├── tests/
│   └── e2e/                    # Pruebas end-to-end entre servicios
└── scripts/                    # Scripts de utilidad (seeds, backups, etc.)
```

## Requisitos Previos

- Docker & Docker Compose
- Python 3.12+
- Make

## Comandos Rápidos

```bash
make up       # Levantar todos los servicios en local
make test     # Ejecutar la suite de pruebas
make lint     # Analizar el código con ruff / linters
make down     # Detener contenedores
```

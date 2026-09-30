# Arquitectura del Sistema - Imperio Barber

## Visión General
Imperio Barber está diseñado bajo una arquitectura de microservicios orientada al dominio (DDD).

### Servicios Principales
1. **Auth Service**: Manejo de autenticación, emisión y validación de tokens JWT, control de sesiones.
2. **Users Service**: Gestión de perfiles de clientes, barberos y administradores.
3. **Orders Service**: Gestión de citas, reservas, servicios y estados de pago.

### Infraestructura
- **PostgreSQL**: Base de datos relacional independiente por servicio.
- **Gateway (Nginx/Traefik)**: Punto de entrada unificado y enrutamiento hacia los microservicios.
- **Frontend (Web)**: Aplicación SPA/SSR desarrollada en Next.js con Tailwind CSS.

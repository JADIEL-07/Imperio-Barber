# Stage 1: compilar Flutter Web (el build queda en /app/build/web)
# Se instala la misma versión de Flutter que usa el CI (.github/workflows/flutter.yml).
# La imagen ghcr.io/cirruslabs/flutter:stable ya no se actualiza (su última versión es 3.29)
# y no cumple las versiones de Dart que exige el proyecto.
FROM debian:bookworm-slim AS build
ARG FLUTTER_VERSION=3.47.6

RUN apt-get update \
 && apt-get install -y --no-install-recommends git curl unzip xz-utils ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch "${FLUTTER_VERSION}" https://github.com/flutter/flutter.git /sdks/flutter
ENV PATH="/sdks/flutter/bin:${PATH}"

RUN flutter config --no-analytics \
 && flutter precache --web

WORKDIR /app

COPY pubspec.yaml analysis_options.yaml ./
RUN flutter pub get

COPY . .
RUN flutter build web --release

# Stage 2: servir el build estático con nginx
FROM nginx:1.25-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

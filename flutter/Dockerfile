# Stage 1: compilar Flutter Web (el build queda en /app/build/web)
FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app

COPY pubspec.yaml analysis_options.yaml ./
RUN flutter config --no-analytics && flutter pub get

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

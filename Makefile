.PHONY: help up down build test test-unit test-contract lint format clean deploy prod-up prod-down prod-logs

help:
	@echo "Comandos disponibles:"
	@echo "  make up          - Levantar todo el stack en local con Docker Compose"
	@echo "  make down        - Detener y remover contenedores locales"
	@echo "  make build       - Reconstruir todas las imágenes de Docker"
	@echo "  make test        - Ejecutar todas las pruebas de backend con pytest"
	@echo "  make lint        - Ejecutar análisis estático con Ruff"
	@echo "  make format      - Formatear código con Ruff"
	@echo "  make deploy      - Reconstruir y desplegar en producción con Docker Compose"
	@echo "  make prod-up     - Levantar stack en segundo plano"
	@echo "  make prod-down   - Detener stack de producción"
	@echo "  make prod-logs   - Ver logs de los servicios en tiempo real"
	@echo "  make clean       - Limpiar cachés y archivos temporales"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

test:
	python -m pytest services/auth/tests services/catalog/tests services/booking/tests -v

test-unit:
	python -m pytest -m unit -v

test-contract:
	python -m pytest -m contract -v

lint:
	python -m ruff check .

format:
	python -m ruff format .

deploy:
	docker compose down
	docker compose build --no-cache
	docker compose up -d

prod-up:
	docker compose up -d

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

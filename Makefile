.PHONY: help up down build test lint format clean

help:
	@echo "Comandos disponibles:"
	@echo "  make up          - Levantar entorno local con docker-compose"
	@echo "  make down        - Detener y remover contenedores locales"
	@echo "  make build       - Reconstruir imágenes de Docker"
	@echo "  make test        - Ejecutar todas las pruebas con pytest"
	@echo "  make test-unit   - Ejecutar pruebas unitarias"
	@echo "  make test-int    - Ejecutar pruebas de integración"
	@echo "  make test-e2e    - Ejecutar pruebas end-to-end"
	@echo "  make lint        - Ejecutar análisis estático (ruff lint)"
	@echo "  make format      - Formatear código (ruff format)"
	@echo "  make clean       - Limpiar cachés y artefactos temporales"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

test:
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
	docker compose -f docker-compose.test.yml down -v

test-unit:
	pytest -m unit

test-int:
	pytest -m integration

test-e2e:
	pytest tests/e2e

lint:
	ruff check .

format:
	ruff format .

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +

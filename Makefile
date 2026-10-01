.PHONY: help test test-unit test-contract lint format clean

help:
	@echo "Comandos disponibles:"
	@echo "  make test          - Ejecutar todas las pruebas de backend con pytest"
	@echo "  make test-unit     - Ejecutar solo pruebas unitarias"
	@echo "  make test-contract - Ejecutar solo pruebas de contrato"
	@echo "  make lint          - Ejecutar análisis estático con Ruff"
	@echo "  make format        - Formatear código con Ruff"
	@echo "  make clean         - Limpiar cachés y archivos temporales"

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

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

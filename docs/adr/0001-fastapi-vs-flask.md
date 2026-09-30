# 0001. Elección de Framework Backend: FastAPI vs Flask

## Estado
Aceptado

## Contexto
Requerimos un framework de alto rendimiento, con soporte asíncrono nativo (async/await), validación automática de contratos mediante Pydantic y generación automática de documentación OpenAPI.

## Decisión
Se elige **FastAPI** para el desarrollo de los microservicios del backend.

## Consecuencias
- Tipado estático robusto y validación de datos integrada.
- Excelente rendimiento para operaciones I/O intensivas.
- Curva de aprendizaje moderna pero estándar en el ecosistema Python.

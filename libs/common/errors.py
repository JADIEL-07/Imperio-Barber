from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class UnauthorizedError(AppError):
    def __init__(self, message: str = "No autenticado o sesion invalida"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)

class ForbiddenError(AppError):
    def __init__(self, message: str = "No tienes permiso para realizar esta accion"):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)

class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso no encontrado"):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)

class ConflictError(AppError):
    def __init__(self, message: str = "Conflicto: el recurso o franja horaria ya esta ocupado"):
        super().__init__(code="CONFLICT", message=message, status_code=409)

class ValidationError(AppError):
    def __init__(self, message: str = "Datos de entrada invalidos"):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422)

class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Un servicio dependiente no esta disponible en este momento"):
        super().__init__(code="SERVICE_UNAVAILABLE", message=message, status_code=503)

def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        first_err = exc.errors()[0] if exc.errors() else {}
        loc = " -> ".join([str(l) for l in first_err.get("loc", [])])
        msg = f"{loc}: {first_err.get('msg', 'Error de validación')}" if loc else first_err.get("msg", "Error de validación")
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "VALIDATION_ERROR", "message": msg}},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "Ocurrio un error inesperado en el servidor"}},
        )

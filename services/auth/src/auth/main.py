from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from libs.common.database import Base
from libs.common.errors import setup_exception_handlers
from libs.common.logging import setup_logging
from src.auth.api.router import router as auth_router
from src.auth.config import get_settings
from src.auth.db.session import engine

logger = setup_logging("auth_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Auth Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Deteniendo Auth Service...")
    await engine.dispose()

app = FastAPI(
    title="Imperio Barber - Auth Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/auth/docs",
    openapi_url="/auth/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_exception_handlers(app)
app.include_router(auth_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}

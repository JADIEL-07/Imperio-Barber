from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from libs.common.database import Base
from libs.common.errors import setup_exception_handlers
from libs.common.logging import setup_logging
from src.catalog.api.router import router as catalog_router
from src.catalog.db.session import engine

logger = setup_logging("catalog_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Catalog Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Deteniendo Catalog Service...")
    await engine.dispose()

app = FastAPI(
    title="Imperio Barber - Catalog Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/catalog/docs",
    openapi_url="/catalog/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_exception_handlers(app)
app.include_router(catalog_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "catalog"}

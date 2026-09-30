from fastapi import FastAPI
from src.auth.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Imperio Barber - auth Service",
    version="0.1.0",
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth"}

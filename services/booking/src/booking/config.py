from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Imperio Barber - Booking Service"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/booking_db"
    session_secret: str = "supersecretkey32charactersminimum!"
    catalog_service_url: str = "http://catalog-service:8000/catalog"
    auth_service_url: str = "http://auth-service:8000/auth"

@lru_cache
def get_settings() -> Settings:
    return Settings()

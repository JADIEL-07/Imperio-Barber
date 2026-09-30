from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Imperio Barber - Catalog Service"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/catalog_db"
    session_secret: str = "supersecretkey32charactersminimum!"

@lru_cache
def get_settings() -> Settings:
    return Settings()

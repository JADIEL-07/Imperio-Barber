FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic pydantic-settings sqlalchemy asyncpg alembic pyjwt httpx pytest pytest-asyncio

COPY libs /app/libs
COPY services/booking /app/services/booking

WORKDIR /app/services/booking

CMD ["uvicorn", "src.booking.main:app", "--host", "0.0.0.0", "--port", "8000"]

from typing import Any, Dict, List
import httpx
from src.booking.config import get_settings

class CatalogUnavailableError(Exception):
    """El microservicio catalog no respondio o respondio con error."""

class CatalogClient:
    """
    Cliente HTTP minimo hacia el microservicio catalog, usado por booking para
    resolver los datos reales (nombre, precio, duracion) de los service_ids /
    combo_id que manda el cliente al crear una cita - booking no tiene acceso
    directo a la base de datos de catalog (son microservicios separados).
    """

    def __init__(self):
        self.base_url = get_settings().catalog_service_url.rstrip("/")

    async def list_services(self) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/services")
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise CatalogUnavailableError(str(exc)) from exc

    async def list_combos(self) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/combos")
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPError as exc:
            raise CatalogUnavailableError(str(exc)) from exc

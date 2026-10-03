from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.config import get_settings
from app.schemas.ingest import TelemetryIn, TelemetryResult
from app.services.ingest import process_telemetry

router = APIRouter(tags=["ingest"])


def require_device_key(
    x_device_api_key: Annotated[str | None, Header()] = None,
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    settings = get_settings()
    key = x_device_api_key
    if not key and authorization and authorization.lower().startswith("bearer "):
        key = authorization.split(" ", 1)[1].strip()
    if not key or key != settings.device_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid device API key")


@router.post("/ingest/telemetry", response_model=TelemetryResult)
async def ingest_telemetry(
    body: TelemetryIn,
    _: None = Depends(require_device_key),
):
    """HTTP fallback for ESP / bench simulation (same path as MQTT)."""
    return await process_telemetry(body)

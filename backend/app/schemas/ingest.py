from pydantic import BaseModel


class TelemetryIn(BaseModel):
    device_id: str
    tap_id: str | None = None
    type: str | None = None  # "status" optional heartbeats
    ts: int | float | None = None
    liters_delta: float = 0.0
    session_liters: float | None = None
    session_end: bool = False
    message_id: str | None = None
    wifi_rssi: int | None = None
    uptime_ms: int | None = None
    firmware_version: str | None = None


class TelemetryResult(BaseModel):
    accepted: bool
    duplicate: bool = False
    detail: str = "ok"
    reading_id: str | None = None
    session_id: str | None = None
    session_closed: bool = False
    daily_date: str | None = None

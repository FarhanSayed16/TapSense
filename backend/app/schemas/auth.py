from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    email: str
    name: str
    role: str
    org_id: str


class TapOut(BaseModel):
    id: str
    name: str
    org_id: str
    campus_id: str
    building_id: str
    floor_id: str
    zone_id: str
    is_control: bool
    device_id: str
    pulses_per_liter: float
    role: Literal["control", "intervention"]


class CalibrationUpdate(BaseModel):
    pulses_per_liter: float = Field(gt=1, lt=5000)
    note: str | None = None


class DeviceOut(BaseModel):
    id: str
    org_id: str
    name: str
    tap_ids: list[str]
    last_seen_at: datetime | None = None
    firmware_version: str | None = None
    status: Literal["online", "stale", "unknown"] = "unknown"


class SessionOut(BaseModel):
    id: str
    tap_id: str
    device_id: str
    started_at: datetime
    ended_at: datetime | None = None
    liters: float
    duration_seconds: float | None = None
    is_long_tail: bool = False


class DailyAggregateOut(BaseModel):
    tap_id: str
    date: str
    liters: float
    session_count: int = 0


class LocationCrumb(BaseModel):
    org_id: str
    org_name: str
    campus_id: str
    campus_name: str
    building_id: str
    building_name: str
    floor_id: str
    floor_name: str
    zone_id: str
    zone_name: str


class OverviewOut(BaseModel):
    location: LocationCrumb
    liters_today: float = 0
    liters_week: float = 0
    active_sessions: int = 0
    device_online: bool = False
    taps: list[TapOut] = Field(default_factory=list)
    # Closed daily totals + open session liters (so UI moves while water runs)
    tap_liters_today: dict[str, float] = Field(default_factory=dict)

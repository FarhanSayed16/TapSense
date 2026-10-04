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
    capabilities: list[str] = Field(default_factory=list)
    building_ids: list[str] | None = None


class OrgOut(BaseModel):
    id: str
    name: str | None = None
    timezone: str | None = None
    feature_flags: dict[str, bool] = Field(default_factory=dict)


class FeatureFlagsUpdate(BaseModel):
    flags: dict[str, bool]


class MemberInvite(BaseModel):
    email: str
    name: str = ""
    role: Literal["org_admin", "facilities", "viewer"] = "viewer"
    password: str = Field(min_length=8)
    building_ids: list[str] | None = None


class MemberUpdate(BaseModel):
    name: str | None = None
    role: Literal["org_admin", "facilities", "viewer"] | None = None
    is_active: bool | None = None
    building_ids: list[str] | None = None
    password: str | None = Field(default=None, min_length=8)


class AlertResolveBody(BaseModel):
    note: str | None = None


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
    wifi_rssi: int | None = None
    architecture: Literal["multi_tap", "single_tap"] = "multi_tap"
    building_id: str | None = None
    floor_id: str | None = None
    zone_id: str | None = None
    mqtt_topic: str | None = None


class DeviceRegister(BaseModel):
    id: str
    name: str | None = None
    tap_ids: list[str] = Field(default_factory=list)
    architecture: Literal["multi_tap", "single_tap"] = "single_tap"
    firmware_version: str | None = None
    building_id: str | None = None
    floor_id: str | None = None
    zone_id: str | None = None
    org_id: str | None = None
    mqtt_topic: str | None = None


class LocationCreate(BaseModel):
    id: str
    name: str
    org_id: str | None = None
    campus_id: str | None = None
    building_id: str | None = None
    floor_id: str | None = None


class TapRegister(BaseModel):
    id: str
    name: str | None = None
    zone_id: str
    is_control: bool = False
    device_id: str | None = None
    pulses_per_liter: float = Field(default=450.0, gt=1, lt=5000)


class SessionOut(BaseModel):
    id: str
    tap_id: str
    device_id: str
    started_at: datetime
    ended_at: datetime | None = None
    liters: float
    duration_seconds: float | None = None
    is_long_tail: bool = False


class OpenSessionOut(BaseModel):
    id: str
    tap_id: str
    liters: float
    started_at: datetime
    last_flow_at: datetime | None = None


class SystemHealthOut(BaseModel):
    mongo: bool = False
    redis: bool | None = None
    device_online: bool = False
    device_last_seen_at: datetime | None = None


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


class ProductPhaseOut(BaseModel):
    """Product science phase: 0=silent, 1=visibility, 2=color, 3=social."""

    product_phase: Literal[0, 1, 2, 3] = 0
    label: str = "Phase 0 — Baseline"
    visibility_enabled: bool = False
    color_enabled: bool = False
    social_enabled: bool = False
    updated_at: datetime | None = None


class ProductPhaseUpdate(BaseModel):
    product_phase: Literal[0, 1, 2, 3]


class SocialFieldUpdate(BaseModel):
    placement_location: str | None = None
    placement_notes: str | None = None
    board_id: str | None = None
    cadence_weekday: int | None = Field(default=None, ge=0, le=6)
    recognition_label: str | None = None
    checklist: dict[str, bool] | None = None


class ThresholdBandsUpdate(BaseModel):
    green_max_ratio: float | None = Field(default=None, gt=0)
    amber_max_ratio: float | None = Field(default=None, gt=0)


class TapThresholdPatch(BaseModel):
    enabled: bool | None = None
    session_liters_threshold: float | None = Field(default=None, gt=0)
    source: str | None = None
    notes: str | None = None


class ThresholdsUpdate(BaseModel):
    bands: ThresholdBandsUpdate | None = None
    taps: dict[str, TapThresholdPatch] | None = None


class ThresholdSuggestRequest(BaseModel):
    start: str = Field(..., description="YYYY-MM-DD")
    end: str = Field(..., description="YYYY-MM-DD")
    apply: bool = False


class LeaderboardBoardUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    scope: Literal["tap", "zone", "floor", "building"] | None = None
    building_id: str | None = None
    floor_id: str | None = None
    zone_id: str | None = None
    exclude_control: bool | None = None
    public: bool | None = None
    enabled: bool | None = None


class PhaseWindowUpdate(BaseModel):
    phase: Literal[0, 1, 2, 3]
    start: str | None = Field(default=None, description="YYYY-MM-DD campus date")
    end: str | None = Field(default=None, description="YYYY-MM-DD campus date")
    notes: str | None = None


class OverviewOut(BaseModel):
    location: LocationCrumb
    liters_today: float = 0
    liters_week: float = 0
    active_sessions: int = 0
    device_online: bool = False
    taps: list[TapOut] = Field(default_factory=list)
    # Closed daily totals + open session liters (so UI moves while water runs)
    tap_liters_today: dict[str, float] = Field(default_factory=dict)
    tap_last_activity: dict[str, datetime | None] = Field(default_factory=dict)
    open_sessions: list[OpenSessionOut] = Field(default_factory=list)
    health: SystemHealthOut = Field(default_factory=SystemHealthOut)
    device_last_seen_at: datetime | None = None
    product_phase: Literal[0, 1, 2, 3] = 0
    phase_label: str = "Phase 0 — Baseline"
    visibility_enabled: bool = False
    color_enabled: bool = False
    social_enabled: bool = False

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "TapSense API"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "tapsense"

    jwt_secret: str = "change-me-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    mqtt_host: str = "broker.hivemq.com"
    mqtt_port: int = 1883
    mqtt_username: str = ""
    mqtt_password: str = ""
    mqtt_telemetry_topic: str = "tapsense/pilot/device_01/telemetry"
    mqtt_enabled: bool = True

    device_api_key: str = "pilot-device-key-change-me"
    campus_timezone: str = "Asia/Kolkata"

    admin_email: str = "admin@tapsense.app"
    admin_password: str = "TapSenseAdmin123!"
    admin_name: str = "TapSense Admin"

    session_idle_seconds: int = 5
    long_tail_liters: float = 5.0
    long_tail_seconds: float = 120.0
    device_stale_seconds: int = 300

    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""
    redis_enabled: bool = False
    redis_key_prefix: str = "tapsense:"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

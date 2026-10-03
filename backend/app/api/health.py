from fastapi import APIRouter

from app.core.config import get_settings
from app.db.mongo import ping_db
from app.db.redis_client import ping_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    settings = get_settings()
    mongo_ok = await ping_db()
    redis_configured = bool(
        settings.redis_enabled
        and settings.upstash_redis_rest_url
        and settings.upstash_redis_rest_token
    )
    redis_ok = await ping_redis() if redis_configured else None
    healthy = mongo_ok and (redis_ok is not False if redis_configured else True)
    return {
        "status": "ok" if healthy else "degraded",
        "mongo": mongo_ok,
        "redis": redis_ok,
        "redis_configured": redis_configured,
        "service": "tapsense-api",
        "env": settings.app_env,
        "db": settings.mongodb_db,
    }

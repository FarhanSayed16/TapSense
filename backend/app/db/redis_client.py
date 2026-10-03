from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger("tapsense.redis")


def _configured() -> bool:
    settings = get_settings()
    return bool(
        settings.redis_enabled
        and settings.upstash_redis_rest_url
        and settings.upstash_redis_rest_token
    )


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "Authorization": f"Bearer {settings.upstash_redis_rest_token}",
        "Content-Type": "application/json",
    }


async def _command(cmd: list[str | int]) -> dict | None:
    settings = get_settings()
    async with httpx.AsyncClient(timeout=8.0) as client:
        res = await client.post(
            settings.upstash_redis_rest_url.rstrip("/"),
            headers=_headers(),
            json=cmd,
        )
        if res.status_code != 200:
            logger.warning("redis cmd %s -> %s %s", cmd[0], res.status_code, res.text[:200])
            return None
        return res.json()


async def ping_redis() -> bool:
    if not _configured():
        return False
    try:
        data = await _command(["PING"])
        if not data:
            return False
        return str(data.get("result", "")).upper() == "PONG"
    except Exception:
        logger.exception("redis ping failed")
        return False


async def redis_set(key: str, value: str, ex_seconds: int | None = None) -> bool:
    if not _configured():
        return False
    settings = get_settings()
    full = f"{settings.redis_key_prefix}{key}"
    try:
        if ex_seconds:
            data = await _command(["SET", full, value, "EX", ex_seconds])
        else:
            data = await _command(["SET", full, value])
        return data is not None and data.get("result") == "OK"
    except Exception:
        logger.exception("redis set failed")
        return False


async def redis_get(key: str) -> str | None:
    if not _configured():
        return None
    settings = get_settings()
    full = f"{settings.redis_key_prefix}{key}"
    try:
        data = await _command(["GET", full])
        if not data:
            return None
        return data.get("result")
    except Exception:
        logger.exception("redis get failed")
        return None

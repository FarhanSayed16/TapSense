from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.ingest import router as ingest_router
from app.api.routes_v1 import data_router, router as auth_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.indexes import ensure_indexes
from app.db.mongo import close_db, ping_db
from app.mqtt.subscriber import start_background_workers, stop_background_workers

logger = logging.getLogger("tapsense")


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    settings = get_settings()
    logger.info("starting %s (%s)", settings.app_name, settings.app_env)
    mongo_ok = await ping_db()
    if mongo_ok:
        logger.info("mongodb ping ok · db=%s", settings.mongodb_db)
        try:
            await ensure_indexes()
            logger.info("mongodb indexes ensured")
        except Exception:
            logger.exception("failed to ensure indexes")
        await start_background_workers()
    else:
        logger.warning(
            "mongodb ping failed · uri host unreachable — /health will report degraded until Mongo is up"
        )
    yield
    await stop_background_workers()
    await close_db()
    logger.info("shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_origin_regex=r"https://.*\.vercel\.app",
    )

    app.include_router(health_router)
    app.include_router(health_router, prefix=settings.api_prefix)
    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(data_router, prefix=settings.api_prefix)
    app.include_router(ingest_router, prefix=settings.api_prefix)

    return app


app = create_app()

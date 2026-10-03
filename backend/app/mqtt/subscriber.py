from __future__ import annotations

import asyncio
import json
import logging
import threading
import time
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger("tapsense.mqtt")

_mqtt_thread: threading.Thread | None = None
_idle_thread: threading.Thread | None = None
_stop = threading.Event()
_loop: asyncio.AbstractEventLoop | None = None


def _handle_payload(raw: str | bytes) -> None:
    from app.schemas.ingest import TelemetryIn
    from app.services.ingest import process_telemetry

    try:
        text = raw.decode("utf-8") if isinstance(raw, (bytes, bytearray)) else raw
        data: dict[str, Any] = json.loads(text)
        payload = TelemetryIn.model_validate(data)

        async def _run():
            return await process_telemetry(payload)

        if _loop is None:
            logger.error("no event loop for mqtt ingest")
            return
        fut = asyncio.run_coroutine_threadsafe(_run(), _loop)
        result = fut.result(timeout=10)
        if result.duplicate:
            logger.debug("mqtt duplicate %s", payload.message_id)
        else:
            logger.info(
                "mqtt ingest device=%s tap=%s closed=%s",
                payload.device_id,
                payload.tap_id,
                result.session_closed,
            )
    except Exception:
        logger.exception("mqtt message handling failed")


def _mqtt_thread_main() -> None:
    settings = get_settings()
    if not settings.mqtt_enabled:
        logger.info("mqtt disabled")
        return

    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        logger.error("paho-mqtt not installed — MQTT subscriber disabled")
        return

    def on_connect(client, userdata, flags, reason_code, properties=None):
        ok = reason_code == 0 or getattr(reason_code, "value", None) == 0 or str(reason_code) in ("Success", "0")
        if ok:
            client.subscribe(settings.mqtt_telemetry_topic)
            logger.info("mqtt subscribed topic=%s", settings.mqtt_telemetry_topic)
        else:
            logger.error("mqtt connect failed: %s", reason_code)

    def on_message(client, userdata, msg):
        _handle_payload(msg.payload)

    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"tapsense-api-{settings.app_env}",
    )
    if settings.mqtt_username:
        client.username_pw_set(settings.mqtt_username, settings.mqtt_password or None)
    client.on_connect = on_connect
    client.on_message = on_message

    while not _stop.is_set():
        try:
            logger.info("mqtt connecting %s:%s", settings.mqtt_host, settings.mqtt_port)
            client.connect(settings.mqtt_host, settings.mqtt_port, keepalive=60)
            client.loop_start()
            while not _stop.is_set():
                time.sleep(0.5)
            client.loop_stop()
            client.disconnect()
        except Exception:
            logger.exception("mqtt disconnected; retry in 5s")
            time.sleep(5)


def _idle_thread_main() -> None:
    from app.services.ingest import close_idle_sessions

    while not _stop.is_set():
        try:
            if _loop is not None:

                async def _run():
                    return await close_idle_sessions()

                fut = asyncio.run_coroutine_threadsafe(_run(), _loop)
                closed = fut.result(timeout=10)
                if closed:
                    logger.info("closed %s idle sessions", closed)
        except Exception:
            logger.exception("idle session sweep failed")
        _stop.wait(2.0)


async def start_background_workers() -> None:
    global _mqtt_thread, _idle_thread, _loop
    _stop.clear()
    _loop = asyncio.get_running_loop()

    if _mqtt_thread is None or not _mqtt_thread.is_alive():
        _mqtt_thread = threading.Thread(target=_mqtt_thread_main, name="mqtt-subscriber", daemon=True)
        _mqtt_thread.start()

    if _idle_thread is None or not _idle_thread.is_alive():
        _idle_thread = threading.Thread(target=_idle_thread_main, name="idle-session-sweeper", daemon=True)
        _idle_thread.start()


async def stop_background_workers() -> None:
    global _mqtt_thread, _idle_thread, _loop
    _stop.set()
    for thread in (_mqtt_thread, _idle_thread):
        if thread and thread.is_alive():
            thread.join(timeout=3)
    _mqtt_thread = None
    _idle_thread = None
    _loop = None

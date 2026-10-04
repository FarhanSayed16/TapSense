"""Phase 20 — org members + feature flags."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.core.roles import FACILITIES, KNOWN_ROLES, ORG_ADMIN, VIEWER, normalize_role
from app.core.security import hash_password
from app.db.mongo import get_db

DEFAULT_FLAGS = {
    "science_ui": True,
    "leaderboard_public": True,
    "visibility_kiosk": True,
    "valve_ui": False,
    "telegram_digest": False,
    "exports": True,
    # Wave-2 / multi-floor demo registry — OFF by default so pilot stays 3 taps
    "showcase_scale": False,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_org(org_id: str = "org_pilot") -> dict[str, Any]:
    db = get_db()
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise ValueError("organization not found")
    flags = {**DEFAULT_FLAGS, **(org.get("feature_flags") or {})}
    return {
        "id": org["id"],
        "name": org.get("name"),
        "timezone": org.get("timezone"),
        "feature_flags": flags,
        "updated_at": org.get("updated_at"),
    }


async def update_feature_flags(
    org_id: str,
    flags: dict[str, bool],
    *,
    updated_by: str | None = None,
) -> dict[str, Any]:
    current = await get_org(org_id)
    next_flags = {**current["feature_flags"]}
    for key, value in flags.items():
        if key not in DEFAULT_FLAGS:
            raise ValueError(f"unknown feature flag: {key}")
        next_flags[key] = bool(value)
    now = _now()
    await get_db().organizations.update_one(
        {"id": org_id},
        {
            "$set": {
                "feature_flags": next_flags,
                "updated_at": now,
                "flags_updated_by": updated_by,
            }
        },
    )
    return await get_org(org_id)


async def list_members(org_id: str = "org_pilot") -> list[dict[str, Any]]:
    out = []
    async for u in get_db().users.find({"org_id": org_id}, {"_id": 0, "password_hash": 0}).sort(
        "email", 1
    ):
        out.append(
            {
                "email": u.get("email"),
                "name": u.get("name"),
                "role": normalize_role(u.get("role")),
                "org_id": u.get("org_id"),
                "is_active": bool(u.get("is_active", True)),
                "building_ids": u.get("building_ids"),
                "created_at": u.get("created_at"),
                "updated_at": u.get("updated_at"),
            }
        )
    return out


async def invite_member(
    *,
    email: str,
    name: str,
    role: str,
    password: str,
    org_id: str = "org_pilot",
    building_ids: list[str] | None = None,
    invited_by: str | None = None,
) -> dict[str, Any]:
    email_n = email.strip().lower()
    role_n = normalize_role(role)
    if role_n not in KNOWN_ROLES:
        raise ValueError("invalid role")
    if role_n == ORG_ADMIN and invited_by:
        # allow org_admin to create another admin
        pass
    if len(password) < 8:
        raise ValueError("password must be at least 8 characters")

    db = get_db()
    existing = await db.users.find_one({"email": email_n})
    if existing:
        raise ValueError("user already exists")

    now = _now()
    doc = {
        "email": email_n,
        "name": name.strip() or email_n,
        "role": role_n,
        "org_id": org_id,
        "is_active": True,
        "password_hash": hash_password(password),
        "building_ids": building_ids,
        "invited_by": invited_by,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(doc)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return doc


async def update_member(
    email: str,
    patch: dict[str, Any],
    *,
    updated_by: str | None = None,
) -> dict[str, Any]:
    email_n = email.strip().lower()
    db = get_db()
    user = await db.users.find_one({"email": email_n})
    if not user:
        raise ValueError("user not found")

    updates: dict[str, Any] = {"updated_at": _now(), "updated_by": updated_by}
    if "name" in patch and patch["name"] is not None:
        updates["name"] = str(patch["name"]).strip()
    if "role" in patch and patch["role"] is not None:
        updates["role"] = normalize_role(patch["role"])
    if "is_active" in patch and patch["is_active"] is not None:
        updates["is_active"] = bool(patch["is_active"])
    if "building_ids" in patch:
        updates["building_ids"] = patch["building_ids"]
    if "password" in patch and patch["password"]:
        if len(patch["password"]) < 8:
            raise ValueError("password must be at least 8 characters")
        updates["password_hash"] = hash_password(patch["password"])

    await db.users.update_one({"email": email_n}, {"$set": updates})
    members = await list_members(user.get("org_id", "org_pilot"))
    for m in members:
        if m["email"] == email_n:
            return m
    raise ValueError("user not found after update")


async def ensure_demo_roles(org_id: str = "org_pilot") -> None:
    """Ensure facilities + viewer demo users exist (dev convenience)."""
    from app.core.config import get_settings

    settings = get_settings()
    db = get_db()
    now = _now()
    demos = [
        {
            "email": "facilities@tapsense.app",
            "name": "Facilities Monitor",
            "role": FACILITIES,
            "password": settings.admin_password,
            "building_ids": ["building_hostel"],
        },
        {
            "email": "viewer@tapsense.app",
            "name": "Read-only Viewer",
            "role": VIEWER,
            "password": settings.admin_password,
            "building_ids": None,
        },
    ]
    for d in demos:
        existing = await db.users.find_one({"email": d["email"]})
        if existing:
            continue
        await db.users.insert_one(
            {
                "email": d["email"],
                "name": d["name"],
                "role": d["role"],
                "org_id": org_id,
                "is_active": True,
                "password_hash": hash_password(d["password"]),
                "building_ids": d["building_ids"],
                "created_at": now,
                "updated_at": now,
            }
        )

    # Ensure org has feature_flags defaults
    org = await db.organizations.find_one({"id": org_id})
    if org and not org.get("feature_flags"):
        await db.organizations.update_one(
            {"id": org_id},
            {"$set": {"feature_flags": DEFAULT_FLAGS, "updated_at": now}},
        )

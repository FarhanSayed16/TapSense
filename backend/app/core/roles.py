"""Phase 20 — org role helpers (org_admin / facilities / viewer)."""

from __future__ import annotations

from typing import Any, Callable, Iterable

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user

ORG_ADMIN = "org_admin"
FACILITIES = "facilities"
VIEWER = "viewer"
KNOWN_ROLES = {ORG_ADMIN, FACILITIES, VIEWER}

# Nav / capability keys used by frontend
CAP_MONITOR = "monitor"
CAP_ALERTS_MANAGE = "alerts_manage"
CAP_SCIENCE = "science"
CAP_ADMIN = "admin"
CAP_MEMBERS = "members"
CAP_FLAGS = "flags"
CAP_WRITE_REGISTRY = "write_registry"
CAP_RESET = "reset"
CAP_CALIBRATE = "calibrate"


ROLE_CAPS: dict[str, set[str]] = {
    ORG_ADMIN: {
        CAP_MONITOR,
        CAP_ALERTS_MANAGE,
        CAP_SCIENCE,
        CAP_ADMIN,
        CAP_MEMBERS,
        CAP_FLAGS,
        CAP_WRITE_REGISTRY,
        CAP_RESET,
        CAP_CALIBRATE,
    },
    FACILITIES: {
        CAP_MONITOR,
        CAP_ALERTS_MANAGE,
        CAP_CALIBRATE,
    },
    VIEWER: {
        CAP_MONITOR,
    },
}


def normalize_role(role: str | None) -> str:
    r = (role or VIEWER).strip().lower()
    return r if r in KNOWN_ROLES else VIEWER


def user_capabilities(user: dict[str, Any]) -> list[str]:
    role = normalize_role(user.get("role"))
    return sorted(ROLE_CAPS.get(role, ROLE_CAPS[VIEWER]))


def allowed_building_ids(user: dict[str, Any]) -> list[str] | None:
    """None = all buildings in org. List = restricted scope."""
    raw = user.get("building_ids")
    if raw is None:
        return None
    if isinstance(raw, list) and len(raw) == 0:
        return None
    if isinstance(raw, list):
        return [str(x) for x in raw]
    return None


def assert_building_access(user: dict[str, Any], building_id: str | None) -> None:
    if not building_id:
        return
    allowed = allowed_building_ids(user)
    if allowed is None:
        return
    if building_id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Building out of scope")


def require_roles(*roles: str) -> Callable:
    allowed = {normalize_role(r) for r in roles}

    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        role = normalize_role(user.get("role"))
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(sorted(allowed))}",
            )
        return user

    return _dep


def require_caps(*caps: str) -> Callable:
    needed = set(caps)

    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        have = set(user_capabilities(user))
        if not needed.issubset(have):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _dep

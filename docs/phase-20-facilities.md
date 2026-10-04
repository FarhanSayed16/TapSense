# Phase 20 — Facilities Product Layer (B4 / F4)

**Goal:** Something facilities would keep after the student project ends — roles, scoped monitoring, alerts, and org settings.

---

## Roles

| Role | Caps |
|---|---|
| `org_admin` | monitor, alerts_manage, science, admin, members, flags, write_registry, reset, calibrate |
| `facilities` | monitor, alerts_manage, calibrate |
| `viewer` | monitor |

Building scope: optional `building_ids` on the user. `null` / empty = all buildings.

---

## Backend

| Endpoint | Notes |
|---|---|
| `GET /auth/me` | Includes `capabilities` + `building_ids` |
| `GET /alerts` | Scoped; `refresh` runs stale + leak sweep |
| `POST /alerts/{id}/ack` | facilities+ |
| `POST /alerts/{id}/resolve` | facilities+ |
| `GET /org` | Feature flags |
| `PATCH /org/feature-flags` | org_admin |
| `GET/POST /org/members` · `PATCH /org/members/{email}` | org_admin |
| Admin/science writes | Gated by `require_caps` |

Leak rule (basic): open session liters ≥ `2× long_tail_liters` **or** age ≥ `3× long_tail_seconds`.

---

## Frontend

| Path | Audience |
|---|---|
| `/alerts` | All roles (ack/resolve: facilities+) |
| `/settings/members` | org_admin |
| `/settings/organization` | org_admin |
| Nav | Science hidden without `science` cap / `science_ui` flag |

---

## Demo users (after seed)

Same password as `ADMIN_PASSWORD` in `.env`:

- `admin@tapsense.app` — org_admin  
- `facilities@tapsense.app` — facilities (scoped to `building_hostel`)  
- `viewer@tapsense.app` — viewer  

```bash
cd backend
.\.venv\Scripts\python -m scripts.seed
```

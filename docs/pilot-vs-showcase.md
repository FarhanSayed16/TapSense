# Pilot vs Showcase (no overlap)

**Physical truth today:** 1 ESP × **3 pipes** (`tap_a`, `tap_b`, `tap_c` on `device_01`) in Hostel Block.

Software also has a **Showcase Wing** (Floor 2, taps D/E, device_02/03) for professor demos. That is **not** installed hardware.

---

## How separation works

| | Pilot | Showcase |
|---|---|---|
| Building | `building_hostel` | `building_showcase` |
| Taps | a, b, c | d, e |
| Device | `device_01` multi_tap | `device_02`, `device_03` single_tap |
| Tag | `deployment_scope=pilot` | `deployment_scope=showcase` |
| Visible by default | Yes | **No** |

Org flag `showcase_scale` (default **false**):

- **OFF** → UI/API show only the 3-pipe pilot  
- **ON** → Showcase Wing appears for demos (Settings → Organization)

---

## Commands

```bash
cd backend
# Move any mixed Wave-2 rows out of the pilot washroom
.\.venv\Scripts\python -m scripts.separate_showcase

# (Re)seed showcase assets into Showcase Wing only
.\.venv\Scripts\python -m scripts.seed_wave2
```

Or as admin: `POST /api/v1/admin/separate-showcase`

---

## After a professor demo

Turn **`showcase_scale` OFF** again so the console returns to the real pilot.

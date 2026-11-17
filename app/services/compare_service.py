"""Builds side-by-side comparison data for two to four planets."""

from app.services import data_service

MAX_COMPARE = 4
MIN_COMPARE = 2


class CompareError(ValueError):
    """Raised when the requested comparison selection is invalid."""


def compare_planets(planet_ids: list) -> dict:
    """Returns structured comparison data for the given planet ids.

    Raises CompareError with a user-facing message if the selection is
    invalid (too few, too many, unknown, or duplicate ids).
    """
    if not planet_ids:
        raise CompareError("Select at least two planets to compare.")

    # Preserve order, drop duplicates
    seen = []
    for pid in planet_ids:
        pid = (pid or "").strip().lower()
        if pid and pid not in seen:
            seen.append(pid)
    planet_ids = seen

    if len(planet_ids) < MIN_COMPARE:
        raise CompareError(f"Select at least {MIN_COMPARE} planets to compare.")
    if len(planet_ids) > MAX_COMPARE:
        raise CompareError(f"You can compare at most {MAX_COMPARE} planets at once.")

    planets = []
    for pid in planet_ids:
        p = data_service.get_planet(pid)
        if not p:
            raise CompareError(f"Unknown planet: '{pid}'.")
        planets.append(p)

    metrics = [
        {"key": "diameter_km", "label": "Diameter", "unit": "km", "path": ("stats", "diameter_km")},
        {"key": "mass_relative_earth", "label": "Mass (relative to Earth)", "unit": "x Earth", "path": ("stats", "mass_relative_earth")},
        {"key": "distance_km", "label": "Distance from Sun", "unit": "km", "path": ("stats", "distance_km")},
        {"key": "gravity_ms2", "label": "Surface Gravity", "unit": "m/s²", "path": ("stats", "gravity_ms2")},
        {"key": "orbital_period_days", "label": "Orbital Period", "unit": "days", "path": ("stats", "orbital_period_days")},
        {"key": "rotation_period_hours", "label": "Rotation Period", "unit": "hours", "path": ("stats", "rotation_period_hours")},
        {"key": "temp_c_avg", "label": "Avg. Temperature", "unit": "°C", "path": ("stats", "temp_c_avg")},
        {"key": "moons", "label": "Moons", "unit": "", "path": ("stats", "moons")},
    ]

    def dig(obj, path):
        for key in path:
            if obj is None:
                return None
            obj = obj.get(key)
        return obj

    rows = []
    for metric in metrics:
        values = [dig(p, metric["path"]) for p in planets]
        numeric = [v for v in values if isinstance(v, (int, float))]
        max_val = max(numeric) if numeric else None
        rows.append({
            "label": metric["label"],
            "unit": metric["unit"],
            "key": metric["key"],
            "values": values,
            "max": max_val,
        })

    return {
        "planets": [
            {
                "id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "color": p["color"],
                "rings": p["stats"]["rings"],
                "atmosphere": p["stats"]["atmosphere"]["summary"],
            }
            for p in planets
        ],
        "rows": rows,
    }

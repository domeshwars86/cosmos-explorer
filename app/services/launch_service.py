"""Upcoming launch data from Launch Library 2 (thespacedevs.com) — a free,
public, unauthenticated API. Normalized and cached the same way as
space_news_service.py, and never allowed to crash the site if it's
unreachable (MASTER PROMPT §23, §35).
"""

import os
import time

import requests

from app.utils import ttl_cache

LL2_BASE = "https://ll.thespacedevs.com/2.2.0"
REQUEST_TIMEOUT_SECONDS = 6
LAUNCH_CACHE_SECONDS = int(os.environ.get("LAUNCH_CACHE_MINUTES", "30")) * 60
POOL_KEY = "launches_upcoming"


class LaunchDataUnavailable(Exception):
    pass


def _normalize(raw: dict) -> dict:
    def as_dict(value):
        return value if isinstance(value, dict) else {}

    provider = as_dict(raw.get("launch_service_provider"))
    rocket = as_dict(as_dict(raw.get("rocket")).get("configuration"))
    pad = as_dict(raw.get("pad"))
    location = as_dict(pad.get("location"))
    mission = as_dict(raw.get("mission"))
    status = as_dict(raw.get("status"))
    orbit = as_dict(mission.get("orbit"))
    net_precision = as_dict(raw.get("net_precision")).get("name", "")
    description = raw.get("description")
    if not isinstance(description, str):
        description = ""

    return {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "agency": provider.get("name", "Unknown Agency"),
        "rocket": rocket.get("full_name") or rocket.get("name") or "Unknown Vehicle",
        "net": raw.get("net"),  # "No Earlier Than" scheduled time, ISO 8601
        "window_start": raw.get("window_start"),
        "window_end": raw.get("window_end"),
        "time_is_precise": str(net_precision).lower() in ("minute", "hour"),
        "status": status.get("name", "Unknown"),
        "status_abbrev": status.get("abbrev", ""),
        "location": location.get("name", "Unknown Location"),
        "country_code": location.get("country_code", ""),
        "mission_type": mission.get("type") or "Unspecified",
        "orbit": orbit.get("name"),
        "description": (description or str(mission.get("description") or ""))[:280] or None,
        "image_url": raw.get("image"),
        "source_url": raw.get("url"),
        "source": "Launch Library 2",
    }


def get_upcoming_launches(limit: int = 10) -> dict:
    limit = max(1, min(limit, 30))

    def _live():
        resp = requests.get(f"{LL2_BASE}/launch/upcoming/", params={"limit": 30, "mode": "normal"}, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict) or not isinstance(data.get("results"), list):
            raise ValueError("The launch service returned an invalid response.")
        return [_normalize(launch) for launch in data["results"] if isinstance(launch, dict)]

    try:
        launches = ttl_cache.get_or_set(POOL_KEY, LAUNCH_CACHE_SECONDS, _live)
        status = "live"
    except (requests.RequestException, ValueError):
        stale = ttl_cache.get_stale(POOL_KEY)
        if stale is None:
            raise LaunchDataUnavailable("Launch data is temporarily unavailable.")
        launches = stale
        status = "cached"

    return {
        "items": launches[:limit],
        "count": len(launches),
        "status": status,
        "last_refreshed": ttl_cache.last_refreshed(POOL_KEY),
    }


def health_check() -> dict:
    cached_at = ttl_cache.last_refreshed(POOL_KEY)
    if cached_at is not None:
        return {"service": "Launch Library 2", "status": "cached", "last_refreshed": cached_at}
    try:
        requests.get(f"{LL2_BASE}/launch/upcoming/", params={"limit": 1}, timeout=REQUEST_TIMEOUT_SECONDS).raise_for_status()
        return {"service": "Launch Library 2", "status": "online", "last_refreshed": time.time()}
    except requests.RequestException:
        return {"service": "Launch Library 2", "status": "offline", "last_refreshed": None}

"""COSMOS Space Intelligence — the service layer between COSMOS's own
internal API and the Spaceflight News API (SNAPI v4). The frontend never
calls SNAPI directly (MASTER PROMPT §4): it only ever talks to COSMOS's
own `/api/news*` routes, which this module backs.

Every article returned by this module has already been normalized into
one consistent shape (see `_normalize`) and tagged/categorized locally
(see space_tagging.py) — the frontend and the rest of COSMOS never need
to know anything about SNAPI's own response format.
"""

import os
import time

import requests

from app.services import space_tagging
from app.utils import ttl_cache

SNAPI_BASE = "https://api.spaceflightnewsapi.net/v4"
REQUEST_TIMEOUT_SECONDS = 6
NEWS_CACHE_SECONDS = int(os.environ.get("NEWS_CACHE_MINUTES", "15")) * 60
NEWS_API_ENABLED = os.environ.get("NEWS_API_ENABLED", "true").strip().lower() != "false"
POOL_SIZE = 100


class SpaceNewsUnavailable(Exception):
    """Raised when SNAPI cannot be reached and no cached fallback exists."""


def _normalize(raw: dict) -> dict:
    title = raw.get("title") or "Untitled"
    summary = (raw.get("summary") or "").strip()
    # Keep excerpts short — never reproduce full articles (MASTER PROMPT §46).
    if len(summary) > 320:
        summary = summary[:317].rsplit(" ", 1)[0] + "…"

    tags = space_tagging.extract_tags(title, summary)
    category = space_tagging.categorize(tags)

    return {
        "id": str(raw.get("id")),
        "title": title,
        "summary": summary,
        "source": raw.get("news_site") or "Unknown Source",
        "source_url": raw.get("url"),
        "published_at": raw.get("published_at"),
        "updated_at": raw.get("updated_at"),
        "image_url": raw.get("image_url") or None,
        "category": category,
        "tags": tags,
        "content_type": "article",
        "related_cosmos": space_tagging.related_cosmos_links(tags),
        "related_suggestions": space_tagging.related_suggestions(tags),
    }


def _request(path: str, params: dict) -> dict:
    if not NEWS_API_ENABLED:
        raise SpaceNewsUnavailable("Space news is disabled via configuration.")
    try:
        resp = requests.get(f"{SNAPI_BASE}{path}", params=params, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json()
    except (requests.RequestException, ValueError) as exc:
        raise SpaceNewsUnavailable(str(exc)) from exc


def _pool_cache_key(search: str, source: str) -> str:
    return f"news_pool:{(search or '').lower()}:{(source or '').lower()}"


def _fetch_pool(search: str = "", source: str = "") -> list:
    """Fetches and normalizes a batch of recent articles matching an
    optional SNAPI-level search/source filter, caches the result, and
    falls back to a stale cache entry (or raises) if the live call fails.
    """
    key = _pool_cache_key(search, source)

    def _live():
        params = {"limit": POOL_SIZE, "ordering": "-published_at"}
        if search:
            params["search"] = search
        if source:
            params["news_site"] = source
        data = _request("/articles/", params)
        return [_normalize(a) for a in data.get("results", [])]

    try:
        return ttl_cache.get_or_set(key, NEWS_CACHE_SECONDS, _live)
    except SpaceNewsUnavailable:
        stale = ttl_cache.get_stale(key)
        if stale is not None:
            return stale
        raise


def get_news(page: int = 1, limit: int = 20, category: str = "", source: str = "", search: str = "") -> dict:
    page = max(1, page)
    limit = max(1, min(limit, 50))
    pool = _fetch_pool(search=search, source=source)

    if category and category.lower() != "all":
        pool = [a for a in pool if a["category"].lower() == category.lower()]

    total = len(pool)
    start = (page - 1) * limit
    items = pool[start:start + limit]

    return {
        "items": items,
        "count": total,
        "page": page,
        "limit": limit,
        "has_more": start + limit < total,
        "status": "live",
        "last_refreshed": ttl_cache.last_refreshed(_pool_cache_key(search, source)),
    }


def get_latest(limit: int = 8) -> list:
    return _fetch_pool()[:limit]


def get_article(article_id: str) -> dict:
    key = f"news_article:{article_id}"

    def _live():
        raw = _request(f"/articles/{article_id}/", {})
        return _normalize(raw)

    try:
        return ttl_cache.get_or_set(key, NEWS_CACHE_SECONDS, _live)
    except SpaceNewsUnavailable:
        stale = ttl_cache.get_stale(key)
        if stale is not None:
            return stale
        # Last resort: check whether it's sitting in any cached pool already.
        for pool in ttl_cache.stale_values_with_prefix("news_pool:"):
            match = next((a for a in pool if a["id"] == str(article_id)), None)
            if match:
                return match
        raise SpaceNewsUnavailable(f"Article {article_id} is not available.")


def get_categories() -> list:
    return space_tagging.ALL_CATEGORIES


def get_available_sources() -> list:
    """Only returns sources actually present in the most recently cached
    pool — never an invented list (MASTER PROMPT §13)."""
    pool = ttl_cache.get_stale(_pool_cache_key("", "")) or []
    return sorted({a["source"] for a in pool if a.get("source")})


def get_stats() -> dict:
    """Numbers for the Space Intelligence dashboard, computed from actual
    cached data — never fabricated (MASTER PROMPT §27)."""
    pool = ttl_cache.get_stale(_pool_cache_key("", "")) or []
    isro_count = sum(1 for a in pool if "ISRO" in a["tags"])
    missions = sum(1 for a in pool if a["category"] in ("Missions", "Launches"))
    return {
        "news_count": len(pool),
        "mission_updates": missions,
        "isro_updates": isro_count,
    }


def health_check() -> dict:
    """A lightweight, non-sensitive status check — used by /api/space/health.
    Makes a minimal live call only if nothing is cached yet."""
    key = _pool_cache_key("", "")
    cached_at = ttl_cache.last_refreshed(key)
    if cached_at is not None:
        return {"service": "Spaceflight News API", "status": "cached", "last_refreshed": cached_at}
    try:
        _request("/articles/", {"limit": 1})
        return {"service": "Spaceflight News API", "status": "online", "last_refreshed": time.time()}
    except SpaceNewsUnavailable:
        return {"service": "Spaceflight News API", "status": "offline", "last_refreshed": None}

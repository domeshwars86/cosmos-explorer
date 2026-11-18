"""A minimal in-memory time-to-live cache.

Used to avoid hammering external APIs (Spaceflight News API, Launch
Library 2) on every page load — see MASTER PROMPT "CACHE SYSTEM". This is
intentionally simple (a dict guarded by a lock) rather than adding
Flask-Caching or a database dependency, matching the project's existing
"keep the backend lightweight" philosophy. Cache contents live only for
the life of the running process — restarting the app clears it, which is
fine for data this ephemeral.
"""

import threading
import time
from typing import Callable, Optional

_lock = threading.Lock()
# key -> (value, set_at_epoch_seconds, expires_at_epoch_seconds)
_store: dict = {}
MAX_ENTRIES = 128


def get(key: str):
    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        value, _set_at, expires_at = entry
        if time.time() > expires_at:
            return None  # expired, but left in place for get_stale() fallback use
        return value


def set(key: str, value, ttl_seconds: int) -> None:
    now = time.time()
    with _lock:
        if key not in _store and len(_store) >= MAX_ENTRIES:
            expired = [cache_key for cache_key, entry in _store.items() if now > entry[2]]
            for cache_key in expired:
                _store.pop(cache_key, None)
            if len(_store) >= MAX_ENTRIES:
                oldest_key = min(_store, key=lambda cache_key: _store[cache_key][1])
                _store.pop(oldest_key, None)
        _store[key] = (value, now, now + ttl_seconds)


def get_or_set(key: str, ttl_seconds: int, producer: Callable):
    """Returns the cached value for `key`, or calls `producer()` to
    compute and cache it. If `producer` raises, the exception propagates —
    callers are expected to catch it and fall back to stale cache data
    (see `get_stale`)."""
    cached = get(key)
    if cached is not None:
        return cached
    value = producer()
    set(key, value, ttl_seconds)
    return value


def get_stale(key: str):
    """Returns a cached value even if it has expired — used as a fallback
    when a live refresh fails, so a transient upstream outage doesn't
    blank out the page (MASTER PROMPT "API FAILURE FALLBACK")."""
    with _lock:
        entry = _store.get(key)
        return entry[0] if entry else None


def last_refreshed(key: str) -> Optional[float]:
    """Returns the unix timestamp `key` was last successfully set, or
    None if there's no entry at all."""
    with _lock:
        entry = _store.get(key)
        return entry[1] if entry else None


def stale_values_with_prefix(prefix: str) -> list:
    """Returns the (possibly-expired) cached values for every key starting
    with `prefix` — used for last-resort fallback scans across a family
    of related cache entries (e.g. all cached news search/source pools)."""
    with _lock:
        return [entry[0] for key, entry in _store.items() if key.startswith(prefix)]


def clear() -> None:
    with _lock:
        _store.clear()

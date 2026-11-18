from app.utils import ttl_cache


def test_cache_evicts_oldest_entry_at_capacity(monkeypatch):
    ttl_cache.clear()
    monkeypatch.setattr(ttl_cache, "MAX_ENTRIES", 2)

    ttl_cache.set("first", 1, 60)
    ttl_cache.set("second", 2, 60)
    ttl_cache.set("third", 3, 60)

    assert ttl_cache.get("first") is None
    assert ttl_cache.get("second") == 2
    assert ttl_cache.get("third") == 3
    ttl_cache.clear()


def test_cache_update_does_not_consume_an_extra_entry(monkeypatch):
    ttl_cache.clear()
    monkeypatch.setattr(ttl_cache, "MAX_ENTRIES", 2)

    ttl_cache.set("first", 1, 60)
    ttl_cache.set("first", 2, 60)
    ttl_cache.set("second", 3, 60)

    assert ttl_cache.get("first") == 2
    assert ttl_cache.get("second") == 3
    ttl_cache.clear()

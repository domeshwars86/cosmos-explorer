"""Tests for the Space Intelligence feature: routes, the news/launch
service layers, caching, and failure fallback. External HTTP calls are
mocked throughout — these tests never depend on live network access or
the real SNAPI/Launch Library 2 services being reachable.
"""

from unittest.mock import patch

import pytest
import requests

from app.services import launch_service, space_news_service, space_tagging
from app.utils import ttl_cache


@pytest.fixture(autouse=True)
def clear_cache():
    ttl_cache.clear()
    yield
    ttl_cache.clear()


def _fake_snapi_response(count=3):
    return {
        "count": count,
        "results": [
            {
                "id": i,
                "title": f"NASA Mars rover finds new evidence #{i}",
                "url": f"https://example.com/story-{i}",
                "image_url": "https://example.com/image.jpg",
                "news_site": "NASA",
                "summary": "A short summary about Mars exploration. " * 5,
                "published_at": "2026-08-24T10:00:00Z",
                "updated_at": "2026-08-24T10:05:00Z",
            }
            for i in range(count)
        ],
    }


class FakeResponse:
    def __init__(self, json_data, status=200):
        self._json = json_data
        self.status_code = status

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"status {self.status_code}")


# ---------------------------------------------------------------------------
# Tagging / categorization (pure functions, no network)
# ---------------------------------------------------------------------------

def test_tagging_extracts_mars_and_nasa():
    tags = space_tagging.extract_tags("NASA Mars rover update", "The rover explores Mars.")
    assert "Mars" in tags
    assert "NASA" in tags


def test_categorize_prioritizes_isro():
    tags = space_tagging.extract_tags("ISRO Chandrayaan Mars comparison", "")
    assert space_tagging.categorize(tags) == "ISRO"


def test_categorize_defaults_to_missions_with_no_tags():
    assert space_tagging.categorize([]) == "Missions"


def test_related_cosmos_links_for_europa():
    links = space_tagging.related_cosmos_links(["Europa"])
    assert any(l["url"] == "/moon/europa" for l in links)


# ---------------------------------------------------------------------------
# space_news_service — success path
# ---------------------------------------------------------------------------

def test_get_news_normalizes_and_paginates():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(5))):
        result = space_news_service.get_news(page=1, limit=2)
    assert len(result["items"]) == 2
    assert result["count"] == 5
    assert result["has_more"] is True
    item = result["items"][0]
    assert item["source"] == "NASA"
    assert "Mars" in item["tags"]
    assert item["category"] in space_tagging.ALL_CATEGORIES


def test_get_news_second_page():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(5))):
        space_news_service.get_news(page=1, limit=2)
        result = space_news_service.get_news(page=2, limit=2)
    assert len(result["items"]) == 2
    assert result["items"][0]["id"] != "0"  # page 2 shouldn't repeat page 1's first item


def test_get_news_category_filter():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(3))):
        result = space_news_service.get_news(category="NASA")
    assert all(item["category"] == "NASA" for item in result["items"])


def test_summary_is_truncated_and_never_the_full_article():
    long_summary = "word " * 200
    raw = {"id": 1, "title": "Test", "url": "https://x.com", "news_site": "NASA", "summary": long_summary, "published_at": "2026-01-01T00:00:00Z"}
    normalized = space_news_service._normalize(raw)
    assert len(normalized["summary"]) <= 321


# ---------------------------------------------------------------------------
# space_news_service — caching & failure fallback
# ---------------------------------------------------------------------------

def test_second_call_uses_cache_not_a_new_request():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(2))) as mock_get:
        space_news_service.get_news()
        space_news_service.get_news()
    assert mock_get.call_count == 1


def test_falls_back_to_stale_cache_on_failure():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(2))):
        first = space_news_service.get_news()
    ttl_cache.set(space_news_service._pool_cache_key("", ""), [i for i in first["items"]], ttl_seconds=-1)  # force-expire

    with patch("app.services.space_news_service.requests.get", side_effect=requests.ConnectionError("boom")):
        result = space_news_service.get_news()
    assert len(result["items"]) == 2  # served from stale cache, not crashed


def test_raises_unavailable_with_no_cache_and_failed_request():
    with patch("app.services.space_news_service.requests.get", side_effect=requests.Timeout("timed out")):
        with pytest.raises(space_news_service.SpaceNewsUnavailable):
            space_news_service.get_news()


def test_malformed_response_does_not_crash():
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse({"not": "expected shape"})):
        result = space_news_service.get_news()
    assert result["items"] == []
    assert result["count"] == 0


# ---------------------------------------------------------------------------
# launch_service
# ---------------------------------------------------------------------------

def _fake_ll2_response(count=2):
    return {
        "count": count,
        "results": [
            {
                "id": f"launch-{i}",
                "name": f"Test Rocket Flight {i}",
                "status": {"name": "Go for Launch", "abbrev": "Go"},
                "net": "2026-09-01T12:00:00Z",
                "window_start": "2026-09-01T12:00:00Z",
                "window_end": "2026-09-01T13:00:00Z",
                "net_precision": {"name": "Minute"},
                "launch_service_provider": {"name": "Test Agency"},
                "rocket": {"configuration": {"full_name": "Test Rocket"}},
                "pad": {"location": {"name": "Test Site", "country_code": "USA"}},
                "mission": {"type": "Communications", "orbit": {"name": "LEO"}, "description": "A test mission."},
                "image": None,
                "url": "https://example.com/launch",
            }
            for i in range(count)
        ],
    }


def test_launch_service_normalizes():
    with patch("app.services.launch_service.requests.get", return_value=FakeResponse(_fake_ll2_response(3))):
        result = launch_service.get_upcoming_launches(limit=2)
    assert len(result["items"]) == 2
    assert result["items"][0]["agency"] == "Test Agency"
    assert result["items"][0]["time_is_precise"] is True


def test_launch_service_fallback_on_failure():
    with pytest.raises(launch_service.LaunchDataUnavailable):
        with patch("app.services.launch_service.requests.get", side_effect=requests.ConnectionError("down")):
            launch_service.get_upcoming_launches()


# ---------------------------------------------------------------------------
# Flask routes & internal API (mocked network)
# ---------------------------------------------------------------------------

def test_space_index_route(client):
    resp = client.get("/space")
    assert resp.status_code in (200, 308)  # blueprint url_prefix may redirect trailing slash


def test_space_isro_route(client):
    resp = client.get("/space/isro")
    assert resp.status_code == 200
    assert b"India" in resp.data


def test_space_agencies_route(client):
    resp = client.get("/space/agencies")
    assert resp.status_code == 200


def test_space_launches_route(client):
    resp = client.get("/space/launches")
    assert resp.status_code == 200


def test_api_news_success(client):
    with patch("app.services.space_news_service.requests.get", return_value=FakeResponse(_fake_snapi_response(3))):
        resp = client.get("/api/news")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["ok"] is True
    assert len(body["data"]["items"]) == 3


def test_api_news_unavailable_returns_503_not_crash(client):
    with patch("app.services.space_news_service.requests.get", side_effect=requests.Timeout()):
        resp = client.get("/api/news")
    assert resp.status_code == 503
    assert resp.get_json()["ok"] is False


def test_api_news_categories(client):
    resp = client.get("/api/news/categories")
    body = resp.get_json()
    assert resp.status_code == 200
    assert "ISRO" in body["data"]


def test_api_news_search_requires_query(client):
    resp = client.get("/api/news/search")
    assert resp.status_code == 400


def test_api_launches_success(client):
    with patch("app.services.launch_service.requests.get", return_value=FakeResponse(_fake_ll2_response(2))):
        resp = client.get("/api/launches/upcoming")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["items"]) == 2


def test_api_space_agencies(client):
    resp = client.get("/api/space/agencies")
    body = resp.get_json()
    assert resp.status_code == 200
    assert any(a["id"] == "isro" for a in body["data"])


def test_api_space_isro(client):
    resp = client.get("/api/space/isro")
    body = resp.get_json()
    assert resp.status_code == 200
    assert "timeline" in body["data"]
    assert "missions" in body["data"]


def test_api_space_health_reports_offline_gracefully(client):
    with patch("app.services.space_news_service.requests.get", side_effect=requests.ConnectionError()), \
         patch("app.services.launch_service.requests.get", side_effect=requests.ConnectionError()):
        resp = client.get("/api/space/health")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["news"]["status"] == "offline"
    assert body["data"]["launches"]["status"] == "offline"

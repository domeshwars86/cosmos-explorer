import pytest


@pytest.mark.parametrize("path", [
    "/",
    "/solar-system",
    "/galaxy",
    "/compare",
    "/explore",
    "/facts",
    "/about",
    "/sun",
    "/dwarf-planets",
    "/labs",
    "/create-planet",
    "/mission-builder",
    "/constellations",
    "/stars",
    "/exoplanets",
    "/astrobiology",
    "/cosmic-timeline",
    "/mystery",
    "/passport",
    "/discover",
    "/glossary",
    "/spacecraft",
    "/quiz",
    "/sources",
    "/small-bodies",
    "/cosmology",
    "/journal",
])
def test_page_routes_ok(client, path):
    resp = client.get(path)
    assert resp.status_code == 200


@pytest.mark.parametrize("planet_id", [
    "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune",
])
def test_planet_pages_ok(client, planet_id):
    resp = client.get(f"/planet/{planet_id}")
    assert resp.status_code == 200
    assert planet_id.encode() in resp.data.lower() or planet_id.capitalize().encode() in resp.data


def test_unknown_planet_returns_404(client):
    resp = client.get("/planet/vulcan")
    assert resp.status_code == 404


def test_moon_page_ok(client):
    resp = client.get("/moon/europa")
    assert resp.status_code == 200


def test_unknown_moon_returns_404(client):
    resp = client.get("/moon/nonexistent")
    assert resp.status_code == 404


def test_dwarf_planet_page_ok(client):
    resp = client.get("/dwarf-planet/pluto")
    assert resp.status_code == 200


def test_unknown_dwarf_planet_returns_404(client):
    resp = client.get("/dwarf-planet/nonexistent")
    assert resp.status_code == 404


def test_constellation_detail_page_ok(client):
    resp = client.get("/constellation/orion")
    assert resp.status_code == 200


def test_constellation_detail_unknown_404(client):
    resp = client.get("/constellation/nonexistent")
    assert resp.status_code == 404


def test_star_detail_page_ok(client):
    resp = client.get("/star/vega")
    assert resp.status_code == 200


def test_exoplanet_detail_page_ok(client):
    resp = client.get("/exoplanet/trappist-1e")
    assert resp.status_code == 200


@pytest.mark.parametrize("mission_id", [
    "voyager", "cassini", "jwst", "chandrayaan3", "mangalyaan", "adityal1",
    "rosetta", "hayabusa2", "tianwen1", "hope", "canadarm2", "mir", "apollo", "messenger",
])
def test_mission_detail_pages_ok(client, mission_id):
    resp = client.get(f"/mission/{mission_id}")
    assert resp.status_code == 200


def test_mission_detail_unknown_404(client):
    resp = client.get("/mission/nonexistent")
    assert resp.status_code == 404


@pytest.mark.parametrize("country_id", [
    "india", "united-states", "europe", "japan", "china", "canada", "uae", "soviet-union", "russia", "international",
])
def test_country_detail_pages_ok(client, country_id):
    resp = client.get(f"/country/{country_id}")
    assert resp.status_code == 200


def test_country_detail_unknown_404(client):
    resp = client.get("/country/nonexistent")
    assert resp.status_code == 404


def test_spacecraft_detail_page_ok(client):
    resp = client.get("/spacecraft/voyager1")
    assert resp.status_code == 200


def test_spacecraft_detail_unknown_404(client):
    resp = client.get("/spacecraft/nonexistent")
    assert resp.status_code == 404


def test_robots_txt(client):
    resp = client.get("/robots.txt")
    assert resp.status_code == 200
    assert b"User-agent: *" in resp.data
    assert b"Sitemap:" in resp.data
    assert resp.mimetype == "text/plain"


def test_sitemap_xml(client):
    resp = client.get("/sitemap.xml")
    assert resp.status_code == 200
    assert resp.mimetype == "application/xml"
    assert b"<urlset" in resp.data
    assert b"/planet/earth" in resp.data
    assert b"/moon/europa" in resp.data


def test_404_page_renders_custom_template(client):
    resp = client.get("/this-page-does-not-exist")
    assert resp.status_code == 404
    assert b"LOST IN SPACE" in resp.data


def test_security_headers_are_applied(client):
    resp = client.get("/")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "SAMEORIGIN"
    assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert resp.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"

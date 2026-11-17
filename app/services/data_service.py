"""Loads and serves the site's astronomy data.

All planetary, lunar, and mission data lives in JSON files under
``app/data``. This module loads them once at import time and exposes small,
well-defined accessor functions so that no other part of the application
needs to touch the filesystem or know about the on-disk data format.
"""

import json
import random
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load(filename: str):
    path = DATA_DIR / filename
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


_sun = _load("sun.json")
_planets = _load("planets.json")
_moons = _load("moons.json")
_dwarf_planets = _load("dwarf_planets.json")
_missions = _load("missions.json")
_facts = _load("facts.json")
_galaxy = _load("galaxy.json")
_constellations = _load("constellations.json")
_stars = _load("stars.json")
_exoplanets = _load("exoplanets.json")
_astrobiology = _load("astrobiology.json")
_cosmic_timeline = _load("cosmic_timeline.json")
_glossary = _load("glossary.json")
_spacecraft = _load("spacecraft.json")
_quiz = _load("quiz.json")
_sources = _load("sources.json")
_agencies = _load("agencies.json")
_isro = _load("isro_timeline.json")
_countries = _load("countries.json")

_planets_by_id = {p["id"]: p for p in _planets}
_dwarf_by_id = {d["id"]: d for d in _dwarf_planets}
_missions_by_id = {m["id"]: m for m in _missions}
_countries_by_id = {c["id"]: c for c in _countries}
_constellations_by_id = {c["id"]: c for c in _constellations}
_stars_by_id = {s["id"]: s for s in _stars}
_exoplanets_by_id = {e["id"]: e for e in _exoplanets}
_glossary_by_id = {g["id"]: g for g in _glossary}
_spacecraft_by_id = {s["id"]: s for s in _spacecraft}

PLANET_ORDER = [p["id"] for p in sorted(_planets, key=lambda p: p["order"])]


# ---------------------------------------------------------------------------
# Sun
# ---------------------------------------------------------------------------

def get_sun() -> dict:
    return _sun


# ---------------------------------------------------------------------------
# Planets
# ---------------------------------------------------------------------------

def get_all_planets() -> list:
    return sorted(_planets, key=lambda p: p["order"])


def get_planet(planet_id: str) -> Optional[dict]:
    return _planets_by_id.get(planet_id.lower()) if planet_id else None


def get_adjacent_planets(planet_id: str) -> tuple:
    """Returns (previous_planet, next_planet) ids, wrapping around."""
    if planet_id not in PLANET_ORDER:
        return None, None
    idx = PLANET_ORDER.index(planet_id)
    prev_id = PLANET_ORDER[idx - 1]
    next_id = PLANET_ORDER[(idx + 1) % len(PLANET_ORDER)]
    return _planets_by_id[prev_id], _planets_by_id[next_id]


def get_extreme_planet(stat_key: str, mode: str = "max") -> Optional[dict]:
    """Returns the planet with the highest ('max') or lowest ('min') value
    of a given key under `stats` (e.g. 'diameter_km', 'gravity_ms2'). Used
    by the search aliases and the Ask COSMOS knowledge engine so those
    features stay in sync with the same dataset every other page uses."""
    candidates = [p for p in _planets if isinstance(p["stats"].get(stat_key), (int, float))]
    if not candidates:
        return None
    fn = max if mode == "max" else min
    return fn(candidates, key=lambda p: p["stats"][stat_key])


# ---------------------------------------------------------------------------
# Moons
# ---------------------------------------------------------------------------

def get_all_moons() -> dict:
    return _moons


def get_moon(moon_id: str) -> Optional[dict]:
    return _moons.get(moon_id.lower()) if moon_id else None


def get_moons_for_planet(planet_id: str) -> list:
    planet = get_planet(planet_id)
    if not planet:
        return []
    return [_moons[m] for m in planet.get("moons", []) if m in _moons]


# ---------------------------------------------------------------------------
# Dwarf planets
# ---------------------------------------------------------------------------

def get_all_dwarf_planets() -> list:
    return _dwarf_planets


def get_dwarf_planet(dwarf_id: str) -> Optional[dict]:
    return _dwarf_by_id.get(dwarf_id.lower()) if dwarf_id else None


# ---------------------------------------------------------------------------
# Missions
# ---------------------------------------------------------------------------

def get_all_missions() -> list:
    return sorted(_missions, key=lambda m: m["year"])


def get_mission(mission_id: str) -> Optional[dict]:
    return _missions_by_id.get(mission_id.lower()) if mission_id else None


def get_missions_for_planet(planet_id: str) -> list:
    planet = get_planet(planet_id)
    if not planet:
        return []
    return [_missions_by_id[m] for m in planet.get("exploration", []) if m in _missions_by_id]


def get_mission_filters() -> dict:
    """Distinct filter values actually present in the mission dataset —
    computed from the data rather than hard-coded, so a new country,
    agency, destination, mission type, or status added to missions.json
    automatically appears in the Explore filters with no frontend change."""
    def present(key):
        return sorted({m[key] for m in _missions if m.get(key)})

    countries = [_countries_by_id[cid] for cid in present("country_id") if cid in _countries_by_id]
    agencies = [_agency_by_id_map()[aid] for aid in present("agency_id") if aid in _agency_by_id_map()]
    return {
        "countries": countries,
        "agencies": agencies,
        "destinations": present("destination"),
        "mission_types": present("mission_type"),
        "statuses": present("status_category"),
    }


def _agency_by_id_map():
    return {a["id"]: a for a in _agencies}


def filter_missions(country: str = "", agency: str = "", destination: str = "",
                     mission_type: str = "", status: str = "") -> list:
    results = get_all_missions()
    if country:
        results = [m for m in results if m.get("country_id") == country]
    if agency:
        results = [m for m in results if m.get("agency_id") == agency or agency in m.get("partners", [])]
    if destination:
        results = [m for m in results if m.get("destination") == destination]
    if mission_type:
        results = [m for m in results if m.get("mission_type") == mission_type]
    if status:
        results = [m for m in results if m.get("status_category") == status]
    return results


def get_missions_for_country(country_id: str) -> list:
    return [m for m in get_all_missions() if m.get("country_id") == country_id]


def get_missions_for_agency(agency_id: str) -> list:
    return [m for m in get_all_missions() if m.get("agency_id") == agency_id or agency_id in m.get("partners", [])]


# ---------------------------------------------------------------------------
# Countries (space exploration profiles)
# ---------------------------------------------------------------------------

def get_countries() -> list:
    return _countries


def get_country(country_id: str) -> Optional[dict]:
    return _countries_by_id.get(country_id.lower()) if country_id else None


# ---------------------------------------------------------------------------
# Facts
# ---------------------------------------------------------------------------

def get_all_facts() -> list:
    return _facts


def get_random_fact() -> str:
    return random.choice(_facts)


def get_fact_of_day(for_date=None) -> dict:
    """Deterministically selects a fact based on the calendar date (day of
    year), so every visitor sees the same "fact of the day" without needing
    a database — and it changes automatically at midnight UTC."""
    from datetime import date, timezone, datetime

    d = for_date or datetime.now(timezone.utc).date()
    index = d.timetuple().tm_yday % len(_facts)
    return {"date": d.isoformat(), "fact": _facts[index]}


# ---------------------------------------------------------------------------
# Galaxy
# ---------------------------------------------------------------------------

def get_galaxy_data() -> dict:
    return _galaxy


# ---------------------------------------------------------------------------
# Constellations
# ---------------------------------------------------------------------------

def get_all_constellations() -> list:
    return _constellations


def get_constellation(constellation_id: str) -> Optional[dict]:
    return _constellations_by_id.get(constellation_id.lower()) if constellation_id else None


# ---------------------------------------------------------------------------
# Stars
# ---------------------------------------------------------------------------

def get_all_stars() -> list:
    return _stars


def get_star(star_id: str) -> Optional[dict]:
    return _stars_by_id.get(star_id.lower()) if star_id else None


# ---------------------------------------------------------------------------
# Exoplanets
# ---------------------------------------------------------------------------

def get_all_exoplanets() -> list:
    return _exoplanets


def get_exoplanet(exoplanet_id: str) -> Optional[dict]:
    return _exoplanets_by_id.get(exoplanet_id.lower()) if exoplanet_id else None


# ---------------------------------------------------------------------------
# Astrobiology
# ---------------------------------------------------------------------------

def get_all_astrobiology() -> dict:
    return _astrobiology


def get_astrobiology(body_id: str) -> Optional[dict]:
    return _astrobiology.get(body_id.lower()) if body_id else None


# ---------------------------------------------------------------------------
# Cosmic timeline (13.8 billion years)
# ---------------------------------------------------------------------------

def get_cosmic_timeline() -> list:
    return _cosmic_timeline


# ---------------------------------------------------------------------------
# Glossary
# ---------------------------------------------------------------------------

def get_glossary() -> list:
    return sorted(_glossary, key=lambda g: g["term"])


def get_glossary_term(term_id: str) -> Optional[dict]:
    return _glossary_by_id.get(term_id.lower()) if term_id else None


# ---------------------------------------------------------------------------
# Spacecraft
# ---------------------------------------------------------------------------

def get_all_spacecraft() -> list:
    return sorted(_spacecraft, key=lambda s: s["launch_year"])


def get_spacecraft(spacecraft_id: str) -> Optional[dict]:
    return _spacecraft_by_id.get(spacecraft_id.lower()) if spacecraft_id else None


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------

def get_quiz_questions(category: Optional[str] = None, limit: int = 10) -> list:
    pool = _quiz if not category or category == "all" else [q for q in _quiz if q["category"] == category]
    pool = list(pool)
    random.shuffle(pool)
    return pool[:limit]


def get_quiz_categories() -> list:
    return sorted({q["category"] for q in _quiz})


# ---------------------------------------------------------------------------
# Data sources
# ---------------------------------------------------------------------------

def get_sources() -> list:
    return _sources


# ---------------------------------------------------------------------------
# Space agencies & India's space programme (static reference data)
# ---------------------------------------------------------------------------

def get_agencies() -> list:
    return _agencies


def get_agency(agency_id: str) -> Optional[dict]:
    return next((a for a in _agencies if a["id"] == agency_id.lower()), None) if agency_id else None


def get_isro_timeline() -> dict:
    return _isro


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

# Descriptive-phrase aliases so search behaves like a light "command"
# interface (e.g. typing "red planet" or "largest planet" jumps straight to
# the matching planet) without requiring any AI/NLP dependency — just a
# deterministic lookup table kept in sync with the dataset via
# get_extreme_planet() where the answer depends on current stats.
def _build_search_aliases() -> dict:
    aliases = {
        "red planet": "mars",
        "blue planet": "earth",
        "our planet": "earth",
        "home planet": "earth",
        "ringed planet": "saturn",
        "planet with rings": "saturn",
        "ice giant": "uranus",
        "gas giant": "jupiter",
    }
    extremes = {
        "largest planet": ("diameter_km", "max"),
        "biggest planet": ("diameter_km", "max"),
        "smallest planet": ("diameter_km", "min"),
        "closest planet to the sun": ("distance_km", "min"),
        "closest planet to sun": ("distance_km", "min"),
        "nearest planet to the sun": ("distance_km", "min"),
        "farthest planet from the sun": ("distance_km", "max"),
        "furthest planet from the sun": ("distance_km", "max"),
        "farthest planet": ("distance_km", "max"),
        "furthest planet": ("distance_km", "max"),
        "hottest planet": ("temp_c_avg", "max"),
        "coldest planet": ("temp_c_avg", "min"),
        "windiest planet": ("gravity_ms2", "max"),  # placeholder metric; see note below
        "planet with the strongest gravity": ("gravity_ms2", "max"),
        "planet with the most moons": ("moons", "max"),
        "planet with most moons": ("moons", "max"),
    }
    for phrase, (key, mode) in extremes.items():
        p = get_extreme_planet(key, mode)
        if p:
            aliases[phrase] = p["id"]
    # Neptune is the empirically windiest planet even though wind speed
    # isn't tracked as a stat field — override the placeholder above.
    aliases["windiest planet"] = "neptune"
    return aliases


SEARCH_ALIASES = _build_search_aliases()


def search(query: str, limit: int = 12) -> list:
    """A lightweight, dependency-free substring search across the site's
    astronomy content. Returns a ranked list of result dicts, each with a
    ``type``, ``id``, ``name``, ``description`` and ``url``.

    Also supports descriptive-phrase aliases (see SEARCH_ALIASES) so
    queries like "largest planet" or "red planet" resolve directly.
    """
    if not query or not query.strip():
        return []
    q = query.strip().lower()
    results = []

    for phrase, target_id in SEARCH_ALIASES.items():
        if q == phrase or (len(q) >= 4 and (q in phrase or phrase in q)):
            p = _planets_by_id.get(target_id)
            if p:
                results.append({
                    "type": "Planet", "id": p["id"], "name": p["name"],
                    "description": f'Matches "{query.strip()}" — {p["category"]}',
                    "url": f"/planet/{p['id']}", "_score": -1,
                })
            break

    def score(name: str) -> int:
        name_l = name.lower()
        if name_l == q:
            return 0
        if name_l.startswith(q):
            return 1
        if q in name_l:
            return 2
        return 3

    # Sun
    if q in _sun["name"].lower() or q in "sun star":
        results.append({
            "type": "Star", "id": "sun", "name": _sun["name"],
            "description": _sun["short_description"], "url": "/sun",
            "_score": score(_sun["name"]),
        })

    # Planets
    for p in _planets:
        haystack = " ".join([p["name"], p["category"], p.get("short_description", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Planet", "id": p["id"], "name": p["name"],
                "description": p["category"], "url": f"/planet/{p['id']}",
                "_score": score(p["name"]),
            })

    # Moons
    for m in _moons.values():
        haystack = " ".join([m["name"], m.get("description", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Moon", "id": m["id"], "name": m["name"],
                "description": f"Moon of {m['parent'].capitalize()}",
                "url": f"/moon/{m['id']}",
                "_score": score(m["name"]),
            })

    # Dwarf planets
    for d in _dwarf_planets:
        haystack = " ".join([d["name"], d.get("short_description", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Dwarf Planet", "id": d["id"], "name": d["name"],
                "description": "Dwarf Planet", "url": f"/dwarf-planet/{d['id']}",
                "_score": score(d["name"]),
            })

    # Missions
    for m in _missions:
        haystack = " ".join([m["name"], m.get("objective", ""), m.get("target", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Mission", "id": m["id"], "name": m["name"],
                "description": f"{m['agency']} · {m['year']}", "url": "/explore#" + m["id"],
                "_score": score(m["name"]),
            })

    # Constellations
    for c in _constellations:
        haystack = " ".join([c["name"], c["meaning"], c.get("mythology", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Constellation", "id": c["id"], "name": c["name"],
                "description": c["meaning"], "url": f"/constellation/{c['id']}",
                "_score": score(c["name"]),
            })

    # Stars
    for s in _stars:
        haystack = " ".join([s["name"], s.get("description", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Star", "id": s["id"], "name": s["name"],
                "description": s.get("spectral_type", "Star"), "url": s.get("url") or f"/star/{s['id']}",
                "_score": score(s["name"]),
            })

    # Exoplanets
    for e in _exoplanets:
        haystack = " ".join([e["name"], e.get("host_star", ""), e.get("notes", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Exoplanet", "id": e["id"], "name": e["name"],
                "description": f"Orbits {e['host_star']}", "url": f"/exoplanet/{e['id']}",
                "_score": score(e["name"]),
            })

    # Glossary
    for g in _glossary:
        haystack = " ".join([g["term"], g.get("simple", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Term", "id": g["id"], "name": g["term"],
                "description": g.get("simple", "")[:80], "url": f"/glossary#{g['id']}",
                "_score": score(g["term"]),
            })

    # Spacecraft
    for s in _spacecraft:
        haystack = " ".join([s["name"], s.get("objective", "")]).lower()
        if q in haystack:
            results.append({
                "type": "Spacecraft", "id": s["id"], "name": s["name"],
                "description": f"{s['agency']} · {s['launch_year']}", "url": f"/spacecraft/{s['id']}",
                "_score": score(s["name"]),
            })

    # Galaxy / terms
    galaxy_terms = {
        "milky way": ("Galaxy", "The Milky Way", "Our home galaxy", "/galaxy"),
        "black hole": ("Concept", "Sagittarius A*", "Supermassive black hole", "/galaxy#black-hole"),
        "sagittarius a*": ("Concept", "Sagittarius A*", "Supermassive black hole", "/galaxy#black-hole"),
    }
    for key, (t, name, desc, url) in galaxy_terms.items():
        if q in key:
            results.append({"type": t, "id": key.replace(" ", "-"), "name": name, "description": desc, "url": url, "_score": score(name)})

    results.sort(key=lambda r: r["_score"])
    seen = set()
    deduped = []
    for r in results:
        key = (r["type"], r["id"])
        if key in seen:
            continue
        seen.add(key)
        r.pop("_score", None)
        deduped.append(r)
    return deduped[:limit]

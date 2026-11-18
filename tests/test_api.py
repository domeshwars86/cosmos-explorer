def test_api_planets_list(client):
    resp = client.get("/api/planets")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["ok"] is True
    assert len(body["data"]) == 8
    assert body["data"][0]["id"] == "mercury"


def test_api_planet_detail(client):
    resp = client.get("/api/planet/earth")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["name"] == "Earth"


def test_api_planet_unknown_404(client):
    resp = client.get("/api/planet/vulcan")
    assert resp.status_code == 404
    assert resp.get_json()["ok"] is False


def test_api_solar_system(client):
    resp = client.get("/api/solar-system")
    body = resp.get_json()
    assert resp.status_code == 200
    assert "sun" in body["data"]
    assert "planets" in body["data"]


def test_api_facts_random(client):
    resp = client.get("/api/facts/random")
    body = resp.get_json()
    assert resp.status_code == 200
    assert isinstance(body["data"]["fact"], str)
    assert len(body["data"]["fact"]) > 0


def test_api_search_finds_orion(client):
    resp = client.get("/api/search?q=Orion")
    body = resp.get_json()
    names = [r["name"] for r in body["data"]["results"]]
    assert "Orion" in names


def test_api_search_finds_betelgeuse(client):
    resp = client.get("/api/search?q=Betelgeuse")
    body = resp.get_json()
    names = [r["name"] for r in body["data"]["results"]]
    assert "Betelgeuse" in names


def test_api_search_finds_europa(client):
    resp = client.get("/api/search?q=Europa")
    body = resp.get_json()
    assert resp.status_code == 200
    names = [r["name"] for r in body["data"]["results"]]
    assert "Europa" in names


def test_api_search_empty_query(client):
    resp = client.get("/api/search?q=")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["results"] == []


def test_api_compare_two_planets(client):
    resp = client.get("/api/compare?planets=earth,mars")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["planets"]) == 2


def test_api_compare_requires_min_two(client):
    resp = client.get("/api/compare?planets=earth")
    assert resp.status_code == 400
    assert resp.get_json()["ok"] is False


def test_api_compare_rejects_unknown_planet(client):
    resp = client.get("/api/compare?planets=earth,vulcan")
    assert resp.status_code == 400


def test_api_compare_rejects_too_many(client):
    resp = client.get("/api/compare?planets=earth,mars,venus,jupiter,saturn")
    assert resp.status_code == 400


def test_api_weight_calculator(client):
    resp = client.get("/api/calculate/weight?weight=70")
    body = resp.get_json()
    assert resp.status_code == 200
    earth_row = next(r for r in body["data"]["results"] if r["id"] == "earth")
    assert abs(earth_row["equivalent_weight"] - 70) < 0.01


def test_api_weight_calculator_rejects_invalid(client):
    resp = client.get("/api/calculate/weight?weight=-5")
    assert resp.status_code == 400


def test_api_weight_calculator_rejects_non_finite(client):
    resp = client.get("/api/calculate/weight?weight=nan")
    assert resp.status_code == 400


def test_api_weight_calculator_requires_value(client):
    resp = client.get("/api/calculate/weight")
    assert resp.status_code == 400


def test_api_age_calculator(client):
    resp = client.get("/api/calculate/age?age=25")
    body = resp.get_json()
    assert resp.status_code == 200
    mercury_row = next(r for r in body["data"]["results"] if r["id"] == "mercury")
    assert mercury_row["age"] > 100  # Mercury years are short, so age is larger


def test_api_age_calculator_rejects_invalid(client):
    resp = client.get("/api/calculate/age?age=-1")
    assert resp.status_code == 400


def test_api_age_calculator_rejects_non_finite(client):
    resp = client.get("/api/calculate/age?age=nan")
    assert resp.status_code == 400


def test_api_moons_for_planet(client):
    resp = client.get("/api/moons/jupiter")
    body = resp.get_json()
    assert resp.status_code == 200
    ids = [m["id"] for m in body["data"]]
    assert "europa" in ids


def test_api_dwarf_planets(client):
    resp = client.get("/api/dwarf-planets")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) == 5


def test_api_fact_of_day_is_deterministic(client):
    r1 = client.get("/api/facts/today").get_json()
    r2 = client.get("/api/facts/today").get_json()
    assert r1["data"]["fact"] == r2["data"]["fact"]


def test_api_search_alias_largest_planet(client):
    resp = client.get("/api/search?q=largest planet")
    body = resp.get_json()
    names = [r["name"] for r in body["data"]["results"]]
    assert names[0] == "Jupiter"


def test_api_search_alias_red_planet(client):
    resp = client.get("/api/search?q=red planet")
    body = resp.get_json()
    names = [r["name"] for r in body["data"]["results"]]
    assert "Mars" in names
    assert names.count("Mars") == 1  # deduped, not double-listed


def test_api_ask_hottest_planet(client):
    resp = client.get("/api/ask?q=Which planet is hottest?")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["matched"] is True
    assert "Venus" in body["data"]["answer"]


def test_api_ask_year_on_mars(client):
    resp = client.get("/api/ask?q=How long is a year on Mars?")
    body = resp.get_json()
    assert body["data"]["matched"] is True
    assert "687" in body["data"]["answer"]


def test_api_ask_moons_of_jupiter(client):
    resp = client.get("/api/ask?q=How many moons does Jupiter have?")
    body = resp.get_json()
    assert body["data"]["matched"] is True
    assert "95" in body["data"]["answer"]


def test_api_ask_unanswerable_returns_suggestions(client):
    resp = client.get("/api/ask?q=what is the meaning of life")
    body = resp.get_json()
    assert body["data"]["matched"] is False
    assert len(body["data"]["suggestions"]) > 0


def test_api_constellations_list(client):
    resp = client.get("/api/constellations")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) == 10


def test_api_constellation_detail(client):
    resp = client.get("/api/constellation/orion")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["name"] == "Orion"


def test_api_constellation_unknown_404(client):
    resp = client.get("/api/constellation/nonexistent")
    assert resp.status_code == 404


def test_api_stars_list(client):
    resp = client.get("/api/stars")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) == 7


def test_api_star_detail(client):
    resp = client.get("/api/star/betelgeuse")
    body = resp.get_json()
    assert body["data"]["name"] == "Betelgeuse"


def test_api_exoplanets_list(client):
    resp = client.get("/api/exoplanets")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) >= 5


def test_api_exoplanet_detail(client):
    resp = client.get("/api/exoplanet/proxima-b")
    body = resp.get_json()
    assert "Proxima" in body["data"]["name"]


def test_api_astrobiology_mars(client):
    resp = client.get("/api/astrobiology/mars")
    body = resp.get_json()
    assert resp.status_code == 200
    assert "know" in body["data"]


def test_api_astrobiology_unknown_404(client):
    resp = client.get("/api/astrobiology/jupiter")
    assert resp.status_code == 404


def test_api_cosmic_timeline(client):
    resp = client.get("/api/cosmic-timeline")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"][0]["id"] == "big-bang"
    assert body["data"][-1]["id"] == "modern-era"


def test_api_mystery_default(client):
    resp = client.get("/api/mystery")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["options"]) == 4
    assert body["data"]["answer_id"] in [o["id"] for o in body["data"]["options"]]


def test_api_mystery_difficulty_clue_counts(client):
    for difficulty, expected_count in [("easy", 5), ("medium", 4), ("hard", 3), ("expert", 2)]:
        resp = client.get(f"/api/mystery?difficulty={difficulty}")
        body = resp.get_json()
        assert len(body["data"]["clues"]) == expected_count


def test_api_mission_builder_options(client):
    resp = client.get("/api/mission-builder/options")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["destinations"]) > 0
    assert len(body["data"]["mission_types"]) == 5


def test_api_mission_builder_build(client):
    resp = client.get("/api/mission-builder?destination=mars&mission_type=rover&spacecraft_type=rover_class&objective=water")
    body = resp.get_json()
    assert resp.status_code == 200
    assert "Mars" in body["data"]["mission_name"]
    assert body["data"]["disclaimer"].startswith("SIMULATED MISSION")


def test_api_mission_builder_invalid_destination(client):
    resp = client.get("/api/mission-builder?destination=nowhere&mission_type=rover&spacecraft_type=rover_class&objective=water")
    assert resp.status_code == 400


def test_api_glossary(client):
    resp = client.get("/api/glossary")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) >= 15


def test_api_spacecraft_list(client):
    resp = client.get("/api/spacecraft")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) == 8


def test_api_spacecraft_detail(client):
    resp = client.get("/api/spacecraft/voyager1")
    body = resp.get_json()
    assert body["data"]["name"] == "Voyager 1"
    assert len(body["data"]["journey"]) > 0


def test_api_spacecraft_unknown_404(client):
    resp = client.get("/api/spacecraft/nonexistent")
    assert resp.status_code == 404


def test_api_quiz_default(client):
    resp = client.get("/api/quiz")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["questions"]) == 10
    assert len(body["data"]["categories"]) > 0


def test_api_quiz_category_filter(client):
    resp = client.get("/api/quiz?category=planets&limit=5")
    body = resp.get_json()
    assert all(q["category"] == "planets" for q in body["data"]["questions"])


def test_api_quiz_negative_limit_is_clamped(client):
    resp = client.get("/api/quiz?limit=-5")
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["questions"]) == 1


def test_api_sources(client):
    resp = client.get("/api/sources")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) > 0


def test_api_search_finds_pulsar_term(client):
    resp = client.get("/api/search?q=pulsar")
    body = resp.get_json()
    names = [r["name"] for r in body["data"]["results"]]
    assert "Pulsar" in names


def test_api_missions(client):
    resp = client.get("/api/missions")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) > 0


def test_api_missions_unfiltered_matches_all(client):
    resp = client.get("/api/missions")
    body = resp.get_json()
    assert len(body["data"]) == 56


def test_api_missions_filter_by_country(client):
    resp = client.get("/api/missions?country=india")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) > 5
    assert all(m["country_id"] == "india" for m in body["data"])


def test_api_missions_filter_by_agency(client):
    resp = client.get("/api/missions?agency=isro")
    body = resp.get_json()
    assert all(m["agency_id"] == "isro" or "isro" in m.get("partners", []) for m in body["data"])


def test_api_missions_filter_by_destination(client):
    resp = client.get("/api/missions?destination=Mars")
    body = resp.get_json()
    assert len(body["data"]) > 3
    assert all(m["destination"] == "Mars" for m in body["data"])


def test_api_missions_filter_combo_no_match(client):
    resp = client.get("/api/missions?country=japan&destination=Sun")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"] == []


def test_api_missions_filters_endpoint(client):
    resp = client.get("/api/missions/filters")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]["countries"]) == 10
    assert "Lunar" in body["data"]["mission_types"]
    assert "ISRO" not in [a.get("id") for a in body["data"]["agencies"]]  # ids are lowercase
    assert any(a["id"] == "isro" for a in body["data"]["agencies"])


def test_api_countries_list(client):
    resp = client.get("/api/countries")
    body = resp.get_json()
    assert resp.status_code == 200
    assert len(body["data"]) == 10


def test_api_country_detail(client):
    resp = client.get("/api/country/india")
    body = resp.get_json()
    assert resp.status_code == 200
    assert body["data"]["name"] == "India"
    assert len(body["data"]["missions"]) > 5
    assert any(a["id"] == "isro" for a in body["data"]["agency_details"])


def test_api_country_unknown_404(client):
    resp = client.get("/api/country/nonexistent")
    assert resp.status_code == 404


def test_api_mission_detail_has_new_fields(client):
    resp = client.get("/api/mission/chandrayaan3")
    body = resp.get_json()
    m = body["data"]
    assert m["country_id"] == "india"
    assert m["agency_id"] == "isro"
    assert len(m["objectives"]) > 0
    assert len(m["achievements"]) > 0
    assert len(m["timeline_stages"]) > 0


def test_api_planet_exploration_includes_backfilled_missions(client):
    """Regression: 'messenger' and 'apollo' were referenced by planets.json
    but missing from missions.json before this expansion — verify they now
    resolve instead of being silently dropped."""
    mercury = client.get("/api/planet/mercury").get_json()["data"]
    assert "messenger" in mercury["exploration"]
    earth = client.get("/api/planet/earth").get_json()["data"]
    assert "apollo" in earth["exploration"]
    resp = client.get("/api/moons/mercury")  # sanity: unrelated endpoint still fine
    assert resp.status_code == 200

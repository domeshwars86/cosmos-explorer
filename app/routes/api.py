"""JSON API endpoints consumed by the frontend's JavaScript.

All responses share the shape ``{"ok": bool, "data": ...}`` or
``{"ok": false, "error": "message"}``, via app.utils.responses.
"""

from flask import Blueprint, request

from app.services import calculator_service, compare_service, data_service
from app.services import launch_service, space_news_service
from app.services.assistant_service import assistant
from app.services.mission_builder_service import MissionBuilderError, build_mission
from app.services.mystery_service import generate_mystery
from app.utils.responses import api_error, api_success

api_bp = Blueprint("api", __name__)


@api_bp.route("/planets")
def planets():
    return api_success(data_service.get_all_planets())


@api_bp.route("/planet/<planet_id>")
def planet(planet_id):
    p = data_service.get_planet(planet_id)
    if not p:
        return api_error(f"Unknown planet: '{planet_id}'.", 404)
    return api_success(p)


@api_bp.route("/sun")
def sun():
    return api_success(data_service.get_sun())


@api_bp.route("/moons/<planet_id>")
def moons_for_planet(planet_id):
    p = data_service.get_planet(planet_id)
    if not p:
        return api_error(f"Unknown planet: '{planet_id}'.", 404)
    return api_success(data_service.get_moons_for_planet(planet_id))


@api_bp.route("/moon/<moon_id>")
def moon(moon_id):
    m = data_service.get_moon(moon_id)
    if not m:
        return api_error(f"Unknown moon: '{moon_id}'.", 404)
    return api_success(m)


@api_bp.route("/dwarf-planets")
def dwarf_planets():
    return api_success(data_service.get_all_dwarf_planets())


@api_bp.route("/dwarf-planet/<dwarf_id>")
def dwarf_planet(dwarf_id):
    d = data_service.get_dwarf_planet(dwarf_id)
    if not d:
        return api_error(f"Unknown dwarf planet: '{dwarf_id}'.", 404)
    return api_success(d)


@api_bp.route("/solar-system")
def solar_system():
    return api_success({
        "sun": data_service.get_sun(),
        "planets": data_service.get_all_planets(),
        "dwarf_planets": data_service.get_all_dwarf_planets(),
    })


@api_bp.route("/galaxy")
def galaxy():
    return api_success(data_service.get_galaxy_data())


@api_bp.route("/facts")
def facts():
    return api_success(data_service.get_all_facts())


@api_bp.route("/facts/random")
def random_fact():
    return api_success({"fact": data_service.get_random_fact()})


@api_bp.route("/facts/today")
def fact_of_day():
    return api_success(data_service.get_fact_of_day())


@api_bp.route("/ask")
def ask_cosmos():
    q = request.args.get("q", "", type=str)
    if len(q) > 200:
        return api_error("Question is too long.", 400)
    return api_success(assistant.ask(q))


@api_bp.route("/missions")
def missions():
    country = request.args.get("country", "", type=str)
    agency = request.args.get("agency", "", type=str)
    destination = request.args.get("destination", "", type=str)
    mission_type = request.args.get("type", "", type=str)
    status = request.args.get("status", "", type=str)
    if not any([country, agency, destination, mission_type, status]):
        return api_success(data_service.get_all_missions())
    return api_success(data_service.filter_missions(country, agency, destination, mission_type, status))


@api_bp.route("/missions/filters")
def missions_filters():
    return api_success(data_service.get_mission_filters())


@api_bp.route("/mission/<mission_id>")
def mission(mission_id):
    m = data_service.get_mission(mission_id)
    if not m:
        return api_error(f"Unknown mission: '{mission_id}'.", 404)
    return api_success(m)


@api_bp.route("/countries")
def countries():
    return api_success(data_service.get_countries())


@api_bp.route("/country/<country_id>")
def country(country_id):
    c = data_service.get_country(country_id)
    if not c:
        return api_error(f"Unknown country: '{country_id}'.", 404)
    return api_success({
        **c,
        "missions": data_service.get_missions_for_country(country_id),
        "agency_details": [data_service.get_agency(a) for a in c.get("agencies", []) if data_service.get_agency(a)],
    })


@api_bp.route("/search")
def search():
    q = request.args.get("q", "", type=str)
    if len(q) > 100:
        return api_error("Search query is too long.", 400)
    results = data_service.search(q)
    return api_success({"query": q, "results": results, "count": len(results)})


@api_bp.route("/compare")
def compare():
    planets_param = request.args.get("planets", "", type=str)
    ids = [p for p in planets_param.split(",") if p.strip()]
    try:
        result = compare_service.compare_planets(ids)
    except compare_service.CompareError as exc:
        return api_error(str(exc), 400)
    return api_success(result)


@api_bp.route("/calculate/weight", methods=["POST", "GET"])
def calculate_weight():
    weight = request.values.get("weight", type=float)
    try:
        result = calculator_service.calculate_weight(weight)
    except calculator_service.CalculatorError as exc:
        return api_error(str(exc), 400)
    return api_success(result)


@api_bp.route("/calculate/age", methods=["POST", "GET"])
def calculate_age():
    age = request.values.get("age", type=float)
    try:
        result = calculator_service.calculate_age(age)
    except calculator_service.CalculatorError as exc:
        return api_error(str(exc), 400)
    return api_success(result)


@api_bp.route("/constellations")
def constellations():
    return api_success(data_service.get_all_constellations())


@api_bp.route("/constellation/<constellation_id>")
def constellation(constellation_id):
    c = data_service.get_constellation(constellation_id)
    if not c:
        return api_error(f"Unknown constellation: '{constellation_id}'.", 404)
    return api_success(c)


@api_bp.route("/stars")
def stars():
    return api_success(data_service.get_all_stars())


@api_bp.route("/star/<star_id>")
def star(star_id):
    s = data_service.get_star(star_id)
    if not s:
        return api_error(f"Unknown star: '{star_id}'.", 404)
    return api_success(s)


@api_bp.route("/exoplanets")
def exoplanets():
    return api_success(data_service.get_all_exoplanets())


@api_bp.route("/exoplanet/<exoplanet_id>")
def exoplanet(exoplanet_id):
    e = data_service.get_exoplanet(exoplanet_id)
    if not e:
        return api_error(f"Unknown exoplanet: '{exoplanet_id}'.", 404)
    return api_success(e)


@api_bp.route("/astrobiology/<body_id>")
def astrobiology(body_id):
    a = data_service.get_astrobiology(body_id)
    if not a:
        return api_error(f"No astrobiology profile for '{body_id}'.", 404)
    return api_success(a)


@api_bp.route("/cosmic-timeline")
def cosmic_timeline():
    return api_success(data_service.get_cosmic_timeline())


@api_bp.route("/mystery")
def mystery():
    difficulty = request.args.get("difficulty", "medium", type=str)
    return api_success(generate_mystery(difficulty))


@api_bp.route("/glossary")
def glossary():
    return api_success(data_service.get_glossary())


@api_bp.route("/spacecraft")
def spacecraft_list():
    return api_success(data_service.get_all_spacecraft())


@api_bp.route("/spacecraft/<spacecraft_id>")
def spacecraft_detail(spacecraft_id):
    s = data_service.get_spacecraft(spacecraft_id)
    if not s:
        return api_error(f"Unknown spacecraft: '{spacecraft_id}'.", 404)
    return api_success(s)


@api_bp.route("/quiz")
def quiz():
    category = request.args.get("category", "all", type=str)
    limit = min(request.args.get("limit", 10, type=int) or 10, 24)
    return api_success({
        "questions": data_service.get_quiz_questions(category, limit),
        "categories": data_service.get_quiz_categories(),
    })


@api_bp.route("/sources")
def sources():
    return api_success(data_service.get_sources())


@api_bp.route("/news")
def news_list():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    category = request.args.get("category", "", type=str)
    source = request.args.get("source", "", type=str)
    search = request.args.get("search", "", type=str)
    try:
        return api_success(space_news_service.get_news(page, limit, category, source, search))
    except space_news_service.SpaceNewsUnavailable:
        return api_error("NEWS DATA TEMPORARILY UNAVAILABLE — the space news service could not be reached and no cached data exists yet.", 503)


@api_bp.route("/news/latest")
def news_latest():
    limit = request.args.get("limit", 8, type=int)
    try:
        return api_success(space_news_service.get_latest(limit))
    except space_news_service.SpaceNewsUnavailable:
        return api_error("NEWS DATA TEMPORARILY UNAVAILABLE.", 503)


@api_bp.route("/news/search")
def news_search():
    q = request.args.get("q", "", type=str)
    if not q.strip():
        return api_error("Provide a search query with ?q=", 400)
    try:
        return api_success(space_news_service.get_news(1, 20, "", "", q))
    except space_news_service.SpaceNewsUnavailable:
        return api_error("NEWS DATA TEMPORARILY UNAVAILABLE.", 503)


@api_bp.route("/news/categories")
def news_categories():
    return api_success(space_news_service.get_categories())


@api_bp.route("/news/sources")
def news_sources():
    return api_success(space_news_service.get_available_sources())


@api_bp.route("/news/<article_id>")
def news_detail(article_id):
    try:
        return api_success(space_news_service.get_article(article_id))
    except space_news_service.SpaceNewsUnavailable:
        return api_error(f"Article '{article_id}' is unavailable right now.", 503)


@api_bp.route("/launches/upcoming")
def launches_upcoming():
    limit = request.args.get("limit", 10, type=int)
    try:
        return api_success(launch_service.get_upcoming_launches(limit))
    except launch_service.LaunchDataUnavailable:
        return api_error("LAUNCH DATA TEMPORARILY UNAVAILABLE.", 503)


@api_bp.route("/space/stats")
def space_stats():
    stats = space_news_service.get_stats()
    launch_count = 0
    try:
        launch_count = launch_service.get_upcoming_launches(30)["count"]
    except launch_service.LaunchDataUnavailable:
        pass
    stats["upcoming_launches"] = launch_count
    stats["agencies"] = len(data_service.get_agencies())
    return api_success(stats)


@api_bp.route("/space/agencies")
def space_agencies():
    return api_success(data_service.get_agencies())


@api_bp.route("/space/isro")
def space_isro():
    return api_success(data_service.get_isro_timeline())


@api_bp.route("/space/health")
def space_health():
    return api_success({
        "news": space_news_service.health_check(),
        "launches": launch_service.health_check(),
    })


@api_bp.route("/mission-builder/options")
def mission_builder_options():
    from app.services.mission_builder_service import MISSION_TYPES, OBJECTIVES, SPACECRAFT_TYPES

    destinations = (
        [{"id": p["id"], "name": p["name"], "kind": "Planet"} for p in data_service.get_all_planets()]
        + [{"id": m["id"], "name": m["name"], "kind": "Moon"} for m in data_service.get_all_moons().values()]
        + [{"id": d["id"], "name": d["name"], "kind": "Dwarf Planet"} for d in data_service.get_all_dwarf_planets()]
    )
    return api_success({
        "destinations": destinations,
        "mission_types": [{"id": k, "label": v} for k, v in MISSION_TYPES.items()],
        "spacecraft_types": [{"id": k, "label": v} for k, v in SPACECRAFT_TYPES.items()],
        "objectives": [{"id": k, "label": v} for k, v in OBJECTIVES.items()],
    })


@api_bp.route("/mission-builder", methods=["POST", "GET"])
def mission_builder():
    destination = request.values.get("destination", "", type=str)
    mission_type = request.values.get("mission_type", "", type=str)
    spacecraft_type = request.values.get("spacecraft_type", "", type=str)
    objective = request.values.get("objective", "", type=str)
    try:
        result = build_mission(destination, mission_type, spacecraft_type, objective)
    except MissionBuilderError as exc:
        return api_error(str(exc), 400)
    return api_success(result)

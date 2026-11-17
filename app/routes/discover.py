"""Discovery & reference section: constellations, stars, exoplanets,
astrobiology, the 13.8-billion-year cosmic timeline, the mystery-object
challenge, and the Explorer Passport.
"""

from flask import Blueprint, abort, render_template

from app.services import data_service

discover_bp = Blueprint("discover", __name__)


@discover_bp.route("/discover")
def discover_hub():
    return render_template(
        "discover_hub.html",
        page_title="Discover — COSMOS",
        page_description="Constellations, stars, exoplanets, astrobiology, the cosmic timeline, and more.",
    )


@discover_bp.route("/constellations")
def constellations():
    return render_template(
        "constellations.html",
        constellations=data_service.get_all_constellations(),
        page_title="Constellations — COSMOS",
        page_description="Explore ten major constellations: their shapes, notable stars, mythology, and best viewing times.",
    )


@discover_bp.route("/constellation/<constellation_id>")
def constellation_detail(constellation_id):
    c = data_service.get_constellation(constellation_id)
    if not c:
        abort(404)
    return render_template(
        "constellation_detail.html",
        constellation=c,
        page_title=f"{c['name']} — COSMOS",
        page_description=f"{c['name']} ({c['meaning']}): notable stars, mythology, and viewing information.",
    )


@discover_bp.route("/stars")
def stars():
    return render_template(
        "stars.html",
        stars=data_service.get_all_stars(),
        page_title="Star Map — COSMOS",
        page_description="Notable stars including Sirius, Betelgeuse, Rigel, Polaris, Vega, and Proxima Centauri.",
    )


@discover_bp.route("/star/<star_id>")
def star_detail(star_id):
    s = data_service.get_star(star_id)
    if not s:
        abort(404)
    return render_template(
        "star_detail.html",
        star=s,
        page_title=f"{s['name']} — COSMOS",
        page_description=s.get("description", ""),
    )


@discover_bp.route("/exoplanets")
def exoplanets():
    return render_template(
        "exoplanets.html",
        exoplanets=data_service.get_all_exoplanets(),
        page_title="Exoplanets — COSMOS",
        page_description="Real confirmed exoplanets and how we find worlds around other stars.",
    )


@discover_bp.route("/exoplanet/<exoplanet_id>")
def exoplanet_detail(exoplanet_id):
    e = data_service.get_exoplanet(exoplanet_id)
    if not e:
        abort(404)
    return render_template(
        "exoplanet_detail.html",
        exoplanet=e,
        page_title=f"{e['name']} — COSMOS",
        page_description=e.get("notes", ""),
    )


@discover_bp.route("/astrobiology")
def astrobiology_hub():
    return render_template(
        "astrobiology.html",
        profiles=data_service.get_all_astrobiology(),
        page_title="Astrobiology Explorer — COSMOS",
        page_description="Could life exist elsewhere? Explore what we know, suspect, and don't yet know about Mars, Europa, Enceladus, and Titan.",
    )


@discover_bp.route("/cosmic-timeline")
def cosmic_timeline():
    return render_template(
        "cosmic_timeline.html",
        timeline=data_service.get_cosmic_timeline(),
        page_title="Cosmic Timeline — COSMOS",
        page_description="A journey through 13.8 billion years, from the Big Bang to today.",
    )


@discover_bp.route("/mystery")
def mystery():
    return render_template(
        "mystery.html",
        page_title="Identify the Object — COSMOS",
        page_description="A short astronomy challenge: guess the planet from its clues.",
    )


@discover_bp.route("/passport")
def passport():
    return render_template(
        "passport.html",
        page_title="Explorer Passport — COSMOS",
        page_description="Your personal exploration progress across COSMOS, stored locally in your browser.",
    )


@discover_bp.route("/glossary")
def glossary():
    return render_template(
        "glossary.html",
        terms=data_service.get_glossary(),
        page_title="COSMOS Dictionary — Astronomy Glossary",
        page_description="A searchable glossary of astronomy terms, from light-year to dark energy.",
    )


@discover_bp.route("/spacecraft")
def spacecraft_list():
    return render_template(
        "spacecraft.html",
        spacecraft=data_service.get_all_spacecraft(),
        page_title="Spacecraft — COSMOS",
        page_description="Notable spacecraft and their mission journeys, from Voyager to James Webb.",
    )


@discover_bp.route("/spacecraft/<spacecraft_id>")
def spacecraft_detail(spacecraft_id):
    s = data_service.get_spacecraft(spacecraft_id)
    if not s:
        abort(404)
    return render_template(
        "spacecraft_detail.html",
        s=s,
        page_title=f"{s['name']} — COSMOS",
        page_description=s.get("objective", ""),
    )


@discover_bp.route("/quiz")
def quiz():
    return render_template(
        "quiz.html",
        categories=data_service.get_quiz_categories(),
        page_title="COSMOS Challenge — Astronomy Quiz",
        page_description="Test your astronomy knowledge across planets, moons, galaxies, and missions.",
    )


@discover_bp.route("/sources")
def sources():
    return render_template(
        "sources.html",
        sources=data_service.get_sources(),
        page_title="Data & Sources — COSMOS",
        page_description="Where COSMOS's astronomy data comes from, and how confident each category is.",
    )


@discover_bp.route("/small-bodies")
def small_bodies():
    return render_template(
        "small_bodies.html",
        page_title="Small Bodies of the Solar System — COSMOS",
        page_description="Asteroids, comets, the asteroid belt, the Kuiper Belt, and the Oort Cloud.",
    )


@discover_bp.route("/cosmology")
def cosmology():
    return render_template(
        "cosmology.html",
        page_title="Cosmology Concepts — COSMOS",
        page_description="Dark matter, dark energy, the expanding universe, and gravitational lensing.",
    )


@discover_bp.route("/journal")
def journal():
    return render_template(
        "journal.html",
        page_title="My COSMOS Journal — COSMOS",
        page_description="Your personal notes on what you've discovered, stored locally in your browser.",
    )

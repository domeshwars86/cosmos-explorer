"""Core site routes: home, solar system, galaxy, compare, explore, facts,
about, sun, moons, and dwarf planets.
"""

from flask import Blueprint, Response, abort, render_template, url_for

from app.services import data_service

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return render_template(
        "index.html",
        planets=data_service.get_all_planets(),
        sun=data_service.get_sun(),
        fact_of_day=data_service.get_fact_of_day(),
        page_title="COSMOS — Explore the Universe",
        page_description="A cinematic, interactive journey through our Solar System and the Milky Way galaxy.",
    )


@main_bp.route("/solar-system")
def solar_system():
    return render_template(
        "solar_system.html",
        planets=data_service.get_all_planets(),
        sun=data_service.get_sun(),
        dwarf_planets=data_service.get_all_dwarf_planets(),
        page_title="Solar System — COSMOS",
        page_description="An interactive 3D simulation of the Solar System with size, distance, and scientific visualization modes.",
    )


@main_bp.route("/galaxy")
def galaxy():
    return render_template(
        "galaxy.html",
        galaxy=data_service.get_galaxy_data(),
        page_title="The Milky Way — COSMOS",
        page_description="Explore the Milky Way galaxy, Sagittarius A*, and the scale of the observable universe.",
    )


@main_bp.route("/compare")
def compare():
    return render_template(
        "compare.html",
        planets=data_service.get_all_planets(),
        page_title="Compare Planets — COSMOS",
        page_description="Compare up to four planets side-by-side across size, gravity, orbit, and more.",
    )


@main_bp.route("/explore")
def explore():
    return render_template(
        "missions.html",
        missions=data_service.get_all_missions(),
        countries=data_service.get_countries(),
        filters=data_service.get_mission_filters(),
        page_title="Global Space Exploration — COSMOS",
        page_description="Humanity's journey into space — missions, milestones, and achievements from every major spacefaring nation and agency.",
    )


@main_bp.route("/mission/<mission_id>")
def mission_detail(mission_id):
    m = data_service.get_mission(mission_id)
    if not m:
        abort(404)
    country = data_service.get_country(m.get("country_id", "")) if m.get("country_id") else None
    agency = data_service.get_agency(m.get("agency_id", "")) if m.get("agency_id") else None
    partner_agencies = [data_service.get_agency(a) for a in m.get("partners", []) if data_service.get_agency(a)]
    return render_template(
        "mission_detail.html",
        m=m,
        country=country,
        agency=agency,
        partner_agencies=partner_agencies,
        page_title=f"{m['name']} — COSMOS",
        page_description=m.get("objective", ""),
    )


@main_bp.route("/country/<country_id>")
def country_detail(country_id):
    c = data_service.get_country(country_id)
    if not c:
        abort(404)
    missions_list = data_service.get_missions_for_country(country_id)
    agency_details = [data_service.get_agency(a) for a in c.get("agencies", []) if data_service.get_agency(a)]
    return render_template(
        "country_detail.html",
        c=c,
        missions=missions_list,
        agency_details=agency_details,
        page_title=f"{c['name']} in Space — COSMOS",
        page_description=c.get("summary", ""),
    )


@main_bp.route("/facts")
def facts():
    return render_template(
        "facts.html",
        facts=data_service.get_all_facts(),
        page_title="Cosmic Facts — COSMOS",
        page_description="Fascinating, scientifically grounded facts about the Solar System and beyond.",
    )


@main_bp.route("/about")
def about():
    return render_template(
        "about.html",
        page_title="About — COSMOS",
        page_description="About the COSMOS Interactive Galaxy & Solar System Explorer project.",
    )


@main_bp.route("/sun")
def sun():
    return render_template(
        "sun.html",
        sun=data_service.get_sun(),
        planets=data_service.get_all_planets(),
        page_title="The Sun — COSMOS",
        page_description="Explore the Sun: our G-type main-sequence star at the center of the Solar System.",
    )


@main_bp.route("/moon/<moon_id>")
def moon(moon_id):
    m = data_service.get_moon(moon_id)
    if not m:
        abort(404)
    parent = data_service.get_planet(m["parent"])
    siblings = data_service.get_moons_for_planet(m["parent"])
    astrobiology = data_service.get_astrobiology(m["id"])
    return render_template(
        "moon.html",
        moon=m,
        parent=parent,
        siblings=siblings,
        astrobiology=astrobiology,
        page_title=f"{m['name']} — COSMOS",
        page_description=m.get("description", ""),
    )


@main_bp.route("/dwarf-planets")
def dwarf_planets():
    return render_template(
        "dwarf_planets.html",
        dwarf_planets=data_service.get_all_dwarf_planets(),
        page_title="Dwarf Planets — COSMOS",
        page_description="Pluto, Eris, Haumea, Makemake, and Ceres — the Solar System's dwarf planets.",
    )


@main_bp.route("/dwarf-planet/<dwarf_id>")
def dwarf_planet(dwarf_id):
    d = data_service.get_dwarf_planet(dwarf_id)
    if not d:
        abort(404)
    return render_template(
        "dwarf_planet.html",
        dwarf=d,
        page_title=f"{d['name']} — COSMOS",
        page_description=d.get("short_description", ""),
    )


@main_bp.route("/robots.txt")
def robots_txt():
    body = "\n".join([
        "User-agent: *",
        "Allow: /",
        f"Sitemap: {url_for('main.sitemap_xml', _external=True)}",
        "",
    ])
    return Response(body, mimetype="text/plain")


@main_bp.route("/sitemap.xml")
def sitemap_xml():
    """A curated sitemap covering every static-path page plus one
    representative dynamic page per family (a planet, a moon, a dwarf
    planet, etc.) — not every generated news article, which changes too
    often to be a meaningful crawl target.
    """
    static_endpoints = [
        "main.index", "main.solar_system", "main.galaxy", "main.compare",
        "main.explore", "main.facts", "main.about", "main.sun",
        "main.dwarf_planets", "labs.labs_home", "labs.create_planet",
        "labs.mission_builder_page", "discover.discover_hub",
        "discover.constellations", "discover.stars", "discover.exoplanets",
        "discover.astrobiology_hub", "discover.cosmic_timeline",
        "discover.mystery", "discover.passport", "discover.glossary",
        "discover.spacecraft_list", "discover.quiz", "discover.sources",
        "discover.small_bodies", "discover.cosmology", "discover.journal",
        "space.index", "space.isro", "space.agencies", "space.launches",
    ]
    urls = [url_for(ep, _external=True) for ep in static_endpoints]
    urls += [url_for("planet.planet_detail", planet_id=p["id"], _external=True) for p in data_service.get_all_planets()]
    urls += [url_for("main.moon", moon_id=m, _external=True) for m in data_service.get_all_moons()]
    urls += [url_for("main.dwarf_planet", dwarf_id=d["id"], _external=True) for d in data_service.get_all_dwarf_planets()]

    xml_items = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{xml_items}</urlset>'
    return Response(xml, mimetype="application/xml")

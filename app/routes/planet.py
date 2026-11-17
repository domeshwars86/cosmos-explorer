"""Individual planet detail page routes, e.g. /planet/mars."""

from flask import Blueprint, abort, render_template

from app.services import data_service

planet_bp = Blueprint("planet", __name__)


@planet_bp.route("/planet/<planet_id>")
def planet_detail(planet_id):
    planet = data_service.get_planet(planet_id)
    if not planet:
        abort(404)

    prev_planet, next_planet = data_service.get_adjacent_planets(planet["id"])
    moons = data_service.get_moons_for_planet(planet["id"])
    missions = data_service.get_missions_for_planet(planet["id"])
    astrobiology = data_service.get_astrobiology(planet["id"])

    return render_template(
        "planet.html",
        planet=planet,
        moons=moons,
        missions=missions,
        astrobiology=astrobiology,
        prev_planet=prev_planet,
        next_planet=next_planet,
        page_title=f"{planet['name']} — COSMOS",
        page_description=planet.get("short_description", ""),
    )

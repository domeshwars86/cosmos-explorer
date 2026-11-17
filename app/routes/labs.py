"""COSMOS Labs: the interactive science-experiment section, plus the
Procedural Planet Generator and Mission Builder — grouped together because
all three are hands-on "try it yourself" tools rather than reference pages.
"""

from flask import Blueprint, render_template

from app.services import data_service

labs_bp = Blueprint("labs", __name__)


@labs_bp.route("/labs")
def labs_home():
    return render_template(
        "labs.html",
        planets=data_service.get_all_planets(),
        page_title="COSMOS Labs — Interactive Astronomy Experiments",
        page_description="Seven hands-on labs: gravity, orbits, eclipses, moon phases, seasons, light-speed delay, and habitability.",
    )


@labs_bp.route("/create-planet")
def create_planet():
    return render_template(
        "create_planet.html",
        page_title="Create a Planet — COSMOS",
        page_description="Design a fictional planet and see its conceptual habitability assessment.",
    )


@labs_bp.route("/mission-builder")
def mission_builder_page():
    return render_template(
        "mission_builder.html",
        page_title="Mission Builder — COSMOS",
        page_description="Design a simulated space mission to any planet, moon, or dwarf planet.",
    )

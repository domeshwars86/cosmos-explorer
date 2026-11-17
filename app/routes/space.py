"""COSMOS Space Intelligence — live space news, upcoming launches, agency
information, and India's space programme. Pages render a shell; the
frontend JS fetches from COSMOS's own /api/news, /api/launches, and
/api/space/* endpoints (never directly from the external APIs).
"""

from flask import Blueprint, render_template

from app.services import data_service

space_bp = Blueprint("space", __name__, url_prefix="/space")


@space_bp.route("/")
def index():
    return render_template(
        "space_index.html",
        page_title="Space Intelligence — COSMOS",
        page_description="Live spaceflight news, mission updates, and upcoming launches from around the world, connected to the COSMOS universe.",
    )


@space_bp.route("/news/<article_id>")
def news_detail(article_id):
    return render_template(
        "space_news_detail.html",
        article_id=article_id,
        page_title="Space News — COSMOS",
        page_description="A space news story, with links to the original source and related COSMOS content.",
    )


@space_bp.route("/isro")
def isro():
    return render_template(
        "space_isro.html",
        isro=data_service.get_isro_timeline(),
        page_title="India in Space — COSMOS",
        page_description="India's space journey: PSLV, GSLV, Chandrayaan, Gaganyaan, Aditya-L1, and more.",
    )


@space_bp.route("/agencies")
def agencies():
    return render_template(
        "space_agencies.html",
        agencies=data_service.get_agencies(),
        page_title="Space Agencies — COSMOS",
        page_description="The world's major space agencies and their exploration focus.",
    )


@space_bp.route("/launches")
def launches():
    return render_template(
        "space_launches.html",
        page_title="Upcoming Launches — COSMOS",
        page_description="Upcoming rocket launches from around the world, via Launch Library 2.",
    )

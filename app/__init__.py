"""Application factory for the COSMOS Interactive Galaxy & Solar System
Explorer.
"""

from pathlib import Path

from flask import Flask, render_template, request

from config import get_config


def create_app(config_object=None):
    app = Flask(__name__, static_folder="../static", template_folder="../templates")
    app.config.from_object(config_object or get_config())

    @app.url_defaults
    def add_static_asset_version(endpoint, values):
        if endpoint == "static" and values.get("filename"):
            asset_path = Path(app.static_folder) / values["filename"]
            try:
                values.setdefault("v", int(asset_path.stat().st_mtime))
            except OSError:
                pass

    _register_blueprints(app)
    _register_error_handlers(app)
    _register_context_processors(app)
    _register_security_headers(app)
    _register_template_filters(app)

    return app


def _register_blueprints(app):
    from app.routes.main import main_bp
    from app.routes.planet import planet_bp
    from app.routes.api import api_bp
    from app.routes.labs import labs_bp
    from app.routes.discover import discover_bp
    from app.routes.space import space_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(planet_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(labs_bp)
    app.register_blueprint(discover_bp)
    app.register_blueprint(space_bp)


def _register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(_error):
        if request.path.startswith("/api/"):
            return {"ok": False, "error": "Not found"}, 404
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(_error):
        if request.path.startswith("/api/"):
            return {"ok": False, "error": "Internal server error"}, 500
        return render_template("errors/500.html"), 500


def _register_context_processors(app):
    @app.context_processor
    def inject_site_meta():
        from datetime import datetime, timezone

        return {
            "site_name": app.config.get("SITE_NAME", "COSMOS"),
            "site_tagline": app.config.get("SITE_TAGLINE", "Explore. Understand. Wonder."),
            "current_year": datetime.now(timezone.utc).year,
        }


def _register_template_filters(app):
    from app.utils.formatting import compact_km, with_commas

    app.jinja_env.filters["compact_km"] = compact_km
    app.jinja_env.filters["with_commas"] = with_commas


def _register_security_headers(app):
    @app.after_request
    def set_security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
        )
        return response

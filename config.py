"""Application configuration.

Configuration values are pulled from environment variables so that no
secrets are ever hard-coded into the source tree. See .env.example for the
full list of supported variables.
"""

import os


def _to_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


class Config:
    """Base configuration shared by all environments."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-me-in-production")
    JSON_SORT_KEYS = False
    TEMPLATES_AUTO_RELOAD = _to_bool(os.environ.get("TEMPLATES_AUTO_RELOAD"), False)

    # Security headers / cookie hardening
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    SITE_NAME = "COSMOS"
    SITE_TAGLINE = "Explore. Understand. Wonder."


class DevelopmentConfig(Config):
    DEBUG = True
    TEMPLATES_AUTO_RELOAD = True


class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "production").strip().lower()
    return CONFIG_MAP.get(env, ProductionConfig)

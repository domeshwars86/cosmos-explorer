import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from config import TestingConfig


@pytest.fixture()
def app():
    app = create_app(TestingConfig)
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()

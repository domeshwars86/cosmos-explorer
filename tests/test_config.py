import pytest

from config import ProductionConfig, get_config


@pytest.mark.parametrize("secret", [None, "change-me-to-a-random-value", "too-short"])
def test_production_config_rejects_missing_or_weak_secret_key(monkeypatch, secret):
    monkeypatch.setenv("FLASK_ENV", "production")
    if secret is None:
        monkeypatch.delenv("SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("SECRET_KEY", secret)

    with pytest.raises(RuntimeError, match="strong SECRET_KEY"):
        get_config()


def test_production_config_is_selected_when_secret_is_present(monkeypatch):
    monkeypatch.setenv("FLASK_ENV", "production")
    monkeypatch.setenv("SECRET_KEY", "s" * 32)

    assert get_config() is ProductionConfig

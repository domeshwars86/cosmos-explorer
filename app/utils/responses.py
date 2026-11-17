"""Small helpers for consistent, well-shaped JSON API responses."""

from flask import jsonify


def api_success(data, status: int = 200):
    payload = {"ok": True, "data": data}
    return jsonify(payload), status


def api_error(message: str, status: int = 400):
    payload = {"ok": False, "error": message}
    return jsonify(payload), status

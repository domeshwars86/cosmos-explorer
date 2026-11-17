"""Development entry point.

Run with:

    python app.py

The app factory pattern (see app/__init__.py) is used so the same codebase
can be served by a production WSGI server (e.g. `gunicorn "app:create_app()"`
on Linux, or Waitress on Windows) without relying on Flask's dev server.
"""

import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    debug = app.config.get("DEBUG", False)
    port = int(os.environ.get("PORT", 5000))
    app.run(host="127.0.0.1", port=port, debug=debug)

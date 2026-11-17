# COSMOS — Interactive Galaxy & Solar System Explorer

COSMOS is a Flask + Three.js educational platform for exploring the Solar
System, the Milky Way, and the broader universe through real 3D
interaction, working physics-based labs, and live space news — rather
than static pages of text.

It is an independent educational project, **not affiliated with or
endorsed by NASA, ESA, ISRO, or any space agency.**

---

## Contents

- [Feature Overview](#feature-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Production Deployment](#production-deployment)
- [Data Sources](#data-sources)
- [Scientific Disclaimer](#scientific-disclaimer)
- [Performance Notes](#performance-notes)
- [Further Reading](#further-reading)

---

## Feature Overview

**Core exploration**
Solar System simulator (play/pause, speed, 4 visualization modes),
individual pages for the Sun, all 8 planets, 17 moons, and 5 dwarf
planets, planet comparison tool, weight/age calculators, global search
with keyword aliases ("red planet" → Mars), and an "Ask COSMOS"
deterministic Q&A engine.

**COSMOS Labs** (`/labs`) — nine hands-on physics labs: Gravity, Orbit (a
real numerically-integrated two-body simulation), Eclipse, Moon Phase,
Seasons, Signal & Light-Speed, Habitability, Stellar Evolution, and
Relativity (real Lorentz-factor interstellar travel math).

**Creation tools** — a procedural planet generator with a saved-worlds
archive (`/create-planet`), and a mission builder that designs a
simulated mission to any real planet/moon/dwarf planet (`/mission-builder`).

**Discovery** (`/discover`) — constellations, a star map, real exoplanets,
an astrobiology explorer (Mars/Europa/Enceladus/Titan), a 13.8-billion-year
cosmic timeline, an astronomy glossary, a quiz, a "guess the planet"
challenge, a personal exploration journal, an achievement/passport
system, and a data-sources/confidence-labeling page.

**Space Intelligence** (`/space`) — live spaceflight news via the
[Spaceflight News API](https://api.spaceflightnewsapi.net/), upcoming
launches via [Launch Library 2](https://thespacedevs.com/llapi), a
dedicated "India in Space" section, and a global space agencies page —
all connected back into the interactive site (a Mars news story links to
the Mars page, the Astrobiology Lab, and the Mission Builder).

Every simulated, procedural, or conceptual visualization is explicitly
labeled as such; every scientific value is approximate and sourced (see
[Scientific Disclaimer](#scientific-disclaimer)).

## Technology Stack

- **Backend:** Python 3.11+, Flask (blueprint-per-domain architecture), pytest
- **Frontend:** Vanilla JavaScript (ES modules), Three.js (vendored locally, no CDN dependency), hand-written CSS design system — no frontend framework or build step
- **External APIs:** Spaceflight News API v4, Launch Library 2 (both free, unauthenticated)
- **Data:** Local JSON files under `app/data/` (no database — see [Architecture](ARCHITECTURE.md))

## Project Structure

```
cosmos-explorer/
├── app.py                  # Dev entry point
├── config.py                # Environment-based Flask config
├── app/
│   ├── __init__.py          # App factory, blueprint + filter registration
│   ├── routes/               # main, planet, api, labs, discover, space
│   ├── services/              # Business logic (data, search, calculators,
│   │                           #  mission builder, space news, launches...)
│   ├── data/                  # Astronomy reference data (JSON)
│   └── utils/                 # Formatting helpers, TTL cache
├── templates/                # Jinja2 templates (one per page + partials)
├── static/
│   ├── css/                   # main / components / animations / responsive
│   ├── js/
│   │   ├── core/                # Reusable modules (3D scene, textures, HUD,
│   │   │                        #  achievements, journal, search, news render)
│   │   ├── labs/                 # One module per physics lab
│   │   ├── pages/                # Page-specific orchestration scripts
│   │   └── vendor/                # Vendored three.module.js + OrbitControls.js
│   └── textures/, images/, models/  # (procedurally generated at runtime;
│                                      # no texture files are shipped — see below)
└── tests/                    # pytest suite (routes, APIs, services)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full request-flow and
Three.js architecture.

## Installation

Requires Python 3.10+.

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `FLASK_ENV` | `production` | `development` \| `production` \| `testing` |
| `SECRET_KEY` | (dev placeholder) | **Must** be overridden in production |
| `PORT` | `5000` | Dev server port |
| `NEWS_API_ENABLED` | `true` | Disable to turn off the live news feed |
| `NEWS_CACHE_MINUTES` | `15` | Space news cache TTL |
| `LAUNCH_CACHE_MINUTES` | `30` | Upcoming-launch cache TTL |

No API key is required for either external integration — both the
Spaceflight News API and Launch Library 2 are free and unauthenticated.
Nothing in this project reads a secret from frontend JavaScript.

## Running Locally

```bash
python app.py
```

Open **http://127.0.0.1:5000**. In development mode (`FLASK_ENV=development`)
the Flask reloader and debugger are active.

## Running Tests

```bash
pytest tests/ -v
```

The suite covers page routes, JSON API responses (including malformed/
missing data and 404 handling), the search alias system, calculators,
comparison logic, the mission builder, and the Space Intelligence layer
— including cache behavior and external-API failure fallback, with all
external HTTP calls mocked so the suite never depends on live network
access.

## Production Deployment

- Set `FLASK_ENV=production` and a strong random `SECRET_KEY`.
- Never run the Flask development server in production. Use a real WSGI
  server, e.g. `gunicorn "app:create_app()"` (Linux) or `waitress-serve
  --call app:create_app` (Windows).
- `DEBUG` is `False` and `SESSION_COOKIE_SECURE` is `True` automatically
  under `ProductionConfig` — verify your deployment serves over HTTPS so
  that cookie setting doesn't silently break sessions.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are applied to every response
  automatically.

## Data Sources

Static astronomy data (planets, moons, the Sun, missions, stars,
exoplanets, constellations) is written as original summaries
cross-checked against NASA / NASA JPL / ESA public fact sheets — see the
in-app **Data & Sources** page (`/sources`) for a full breakdown by
category, including which values are measured, estimated, or modeled.

Live content comes from the Spaceflight News API (article aggregation)
and Launch Library 2 (launch schedules) — COSMOS is an aggregator for
this content, not the original publisher. Every article links to its
original source and is never reproduced beyond a short excerpt.

## Scientific Disclaimer

Planetary and astronomical values are approximate and may vary depending
on measurement method and reference source. Visualizations are designed
for educational clarity and are **not** drawn to true physical scale
unless explicitly labeled "Scientific Mode." Procedurally generated
planets, missions, and quiz content are clearly labeled as fictional or
simulated. No content on this site claims evidence of extraterrestrial
life; astrobiology content is framed strictly as "what we know / suspect
/ don't know."

## Performance Notes

- Three.js is loaded once, vendored locally (no CDN dependency), with an
  import map so every page's ES modules share one copy.
- Device pixel ratio is capped (2× normally, 1.25× in Performance Mode);
  particle/star counts scale down accordingly.
- All Three.js scenes dispose their geometries, materials, textures, and
  `OrbitControls` instances before rebuilding — verified explicitly for
  the procedural planet generator, which rebuilds its scene on every
  slider change.
- Render loops pause automatically via `IntersectionObserver` when their
  canvas scrolls off-screen, and respect `prefers-reduced-motion`.
- External API responses (news, launches) are cached server-side with
  configurable TTLs and a stale-cache fallback so a transient upstream
  outage never breaks the page.

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — request flow, service layer, Three.js architecture
- [FUTURE_IMPROVEMENTS.md](FUTURE_IMPROVEMENTS.md) — deferred feature ideas, prioritized

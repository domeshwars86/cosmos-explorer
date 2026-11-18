# COSMOS — Architecture

This document describes how a request flows through the application, how
the codebase is organized, and how the Three.js layer is structured. It
reflects the code as it actually exists — see [README.md](README.md) for
the feature list and setup instructions.

## 1. High-level request flow

```
Browser
  │
  ├─ Page request (GET /planet/mars, /space, /labs, ...)
  │     ↓
  │   Flask Blueprint route  (app/routes/*.py)
  │     ↓
  │   Service layer  (app/services/*.py)
  │     ↓
  │   Local JSON data  (app/data/*.json)   — for reference astronomy content
  │     — or —
  │   External API + TTL cache  (app/utils/ttl_cache.py)  — for live content
  │     ↓
  │   Jinja2 template render  (templates/*.html)
  │     ↓
  │   HTML + inline JSON bootstrap data → browser
  │
  └─ Frontend fetch (GET /api/...)
        ↓
      Same Flask API blueprint → same service layer → JSON response
```

The frontend **never** calls an external API (SNAPI, Launch Library 2)
directly — only COSMOS's own `/api/*` routes. This keeps caching,
normalization, and failure handling in one place, and means no API key
or third-party endpoint is ever visible in browser JavaScript.

## 2. Flask architecture

The app is a **factory** (`app/__init__.py:create_app`), not a bare
module-level `Flask(__name__)`, so `config.py`'s `TestingConfig` can be
swapped in cleanly for the pytest suite (see `tests/conftest.py`).

Six blueprints, one per domain, each independently registered:

| Blueprint | Prefix | Responsibility |
|---|---|---|
| `main` | `/` | Home, Solar System, Sun, Moon, Galaxy, Compare, Explore, Facts, About, Dwarf Planets, robots.txt/sitemap.xml |
| `planet` | `/planet` | Individual planet detail pages |
| `labs` | `/labs`, `/create-planet`, `/mission-builder` | Interactive physics labs and creation tools |
| `discover` | (mixed paths) | Constellations, stars, exoplanets, astrobiology, cosmic timeline, glossary, quiz, mystery, passport, sources |
| `space` | `/space` | Live news, launches, ISRO, agencies |
| `api` | `/api` | JSON endpoints consumed by every page's frontend JS |

Each blueprint's routes are thin: they call into `app/services/` and
pass the result to `render_template`. No route contains business logic
or reaches into `app/data/` directly.

### Service layer

`app/services/data_service.py` is the single source of truth for all
static reference data — it loads every JSON file in `app/data/` once at
import time and exposes typed accessor functions (`get_planet(id)`,
`get_moons_for_planet(id)`, `search(query)`, ...). No other module reads
from `app/data/` directly, and no template ever touches raw JSON.

Other services are narrowly scoped:

- `compare_service.py` — planet comparison table construction
- `calculator_service.py` — weight/age calculators
- `assistant_service.py` — the deterministic "Ask COSMOS" rule engine
- `mission_builder_service.py` — simulated mission generation
- `mystery_service.py` — the "Identify the Object" challenge
- `space_tagging.py` — keyword→category/tag classification for news
- `space_news_service.py` / `launch_service.py` — external API clients,
  normalization, and caching (see below)

### Caching (`app/utils/ttl_cache.py`)

A minimal in-process, thread-safe, dict-backed TTL cache — deliberately
not Flask-Caching or a database, matching the project's "keep the
backend lightweight" approach (see `requirements.txt`: three
dependencies plus `requests`). Every external-API-backed service call
follows the same pattern:

```
get_or_set(cache_key, ttl_seconds, producer)
  → cache hit  → return cached value
  → cache miss → call producer() (the real HTTP request)
       → success → cache and return
       → failure → get_stale(cache_key) → return old data if any exists,
                    otherwise raise a typed *Unavailable exception
```

Routes catch that typed exception and return a `503` with a clear
`"...TEMPORARILY UNAVAILABLE"` message — the external API being down
never produces a Flask 500 or a broken page.

### Data architecture

Astronomy content lives in `app/data/*.json` — 18 files (planets, moons,
sun, dwarf planets, missions, spacecraft, facts, galaxy, constellations,
stars, exoplanets, astrobiology, cosmic timeline, glossary, quiz,
sources, agencies, ISRO timeline). There is no database: this is
read-only reference content that changes by editing JSON, not by writing
migrations. `data_service.py` is where you'd introduce a real database
later without touching any route or template, since it's the only layer
that knows the storage format.

## 3. Frontend architecture

No framework, no build step, no bundler — plain ES modules loaded via a
browser-native `<script type="importmap">` (see `templates/base.html`),
so every page's JavaScript can `import * as THREE from 'three'` and
resolve to the one vendored copy at `static/js/vendor/three.module.js`.

```
static/js/
├── core/         Reusable, page-agnostic modules:
│                   scene.js         — renderer/starfield/dispose helpers
│                   textures.js      — procedural canvas texture generators
│                   planet-builder.js/body-viewer.js/orrery.js — 3D scene builders
│                   settings.js, achievements.js, journal.js, news-tracker.js
│                   — all localStorage-backed, all exposed as window.COSMOS.*
├── labs/         One small module per physics lab (gravity.js, orbit.js, ...),
│                   each exporting a single init function
├── pages/        Page-specific orchestration — imports from core/ and labs/,
│                   wires up DOM event listeners for one specific template
└── vendor/       three.module.js, OrbitControls.js (vendored, not CDN-loaded)
```

`main.js` (loaded on every page) owns cross-cutting UI: the loading screen,
sticky nav, settings panel, global search, cursor effects, optional planetary
ambience toggle, and the "Take Me Somewhere" navigator.

### Three.js scene architecture

Every 3D scene is built from the same small toolkit in `core/scene.js`
and `core/textures.js` rather than being written ad hoc per page:

- **Textures are procedural**, generated on an offscreen `<canvas>` at
  load time (craters, cloud bands, ring gradients) instead of downloaded
  image files — this means no texture licensing concerns and a 3D scene
  can never fail to render because an asset is missing.
- **`createRenderer()`** caps device pixel ratio (2× normally, 1.25× in
  Performance Mode) and reads `prefers-reduced-motion`/Settings state.
- **`createLoop()`** wraps `requestAnimationFrame` in an
  `IntersectionObserver` so a scene's render loop automatically pauses
  when its canvas scrolls out of view, and renders a single still frame
  (rather than looping) under reduced motion.
- **`disposeObject3D()`** walks a scene graph disposing every geometry,
  material, and texture. Anywhere a scene is rebuilt in place — the
  procedural planet generator rebuilds on every slider change — the old
  scene, renderer, and `OrbitControls` instance are explicitly disposed
  first (`controls.dispose()` + `disposeObject3D(scene)` +
  `renderer.dispose()`) before the new one is constructed, so repeated
  interaction doesn't accumulate orphaned WebGL contexts or duplicate
  input event listeners.

Because this is a traditional multi-page Flask app (not a single-page
app), each page load is a fresh JavaScript context — navigating away
from a 3D page discards its scene entirely for free, which sidesteps an
entire class of SPA-style memory leak that would otherwise need
explicit teardown-on-route-change logic.

## 4. Testing strategy

`tests/` is organized by concern (`test_routes.py`, `test_api.py`,
`test_space_intelligence.py`) rather than mirroring the blueprint
structure 1:1. `conftest.py` builds the app via `create_app(TestingConfig)`
so tests never touch a real `.env`.

External HTTP calls (SNAPI, Launch Library 2) are mocked with
`unittest.mock.patch` at the `requests.get` call site inside each
service module — the test suite validates normalization, caching,
pagination, category filtering, and failure-fallback behavior without
depending on either external service being reachable or returning
consistent data at test time.

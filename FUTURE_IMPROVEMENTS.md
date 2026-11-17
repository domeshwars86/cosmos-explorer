# COSMOS — Future Improvements

Ideas discovered during development and this polish pass that were
deliberately **not** implemented, to keep each phase of work scoped and
avoid feature creep. Nothing here is planned or promised — this is a
backlog, not a roadmap.

---

## High Priority

### Content-Security-Policy header
**Idea:** Add a `Content-Security-Policy` response header alongside the
existing `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/
`Permissions-Policy` set.
**Reason:** The app now renders arbitrary external image URLs (space
news thumbnails from many different domains) and loads Google Fonts —
a CSP would meaningfully harden against injected-script scenarios.
**Why deferred:** Templates use inline `style="..."` attributes
pervasively (hundreds of instances across 46 templates) for one-off
layout tweaks. A CSP strict enough to matter would need `style-src`
without `'unsafe-inline'`, which means auditing and moving every inline
style into CSS classes first — a large, regression-risky refactor that
doesn't belong in a "polish, don't rebuild" pass. `img-src` would also
need to stay permissive (`https:`) since news thumbnails come from
unpredictable domains.
**Possible implementation:** A follow-up pass that (1) migrates the most
common inline-style patterns into utility CSS classes, (2) ships a CSP
with `style-src 'self' https://fonts.googleapis.com`, `img-src 'self'
https: data:`, `script-src 'self'`, in report-only mode first to catch
regressions before enforcing.

### Follow Topics / My Space Feed UI
**Idea:** A UI for the topic-following system (Mars, ISRO, NASA, JWST,
etc.) with a personalized feed view.
**Reason:** Requested explicitly in the Space Intelligence brief; the
data layer already exists and is unused.
**Why deferred:** Was descoped during the Space Intelligence build to
keep that already-large addition bounded; per the "no new features"
rule this pass, adding the UI now was out of scope.
**Possible implementation:** `window.COSMOS.newsTracker` already has
`toggleFollow(topic)` / `isFollowing(topic)` / `getFollowedTopics()`
fully implemented and localStorage-backed
(`static/js/core/news-tracker.js`) — a "Follow" button on news cards and
a filter on `/space` reading `getFollowedTopics()` would be a small,
low-risk addition.

### Generic RSS ingestion service
**Idea:** A `rss_service.py` that ingests official agency RSS feeds
(NASA/JPL, etc.) as a secondary news source alongside SNAPI.
**Reason:** Originally requested as a fallback data source and for
direct-from-agency attribution.
**Why deferred:** Adds a new dependency (`feedparser`) and a second,
differently-shaped data pipeline to normalize and de-duplicate against
SNAPI's output — meaningfully more surface area than the time available
allowed to build *and* test properly. SNAPI already aggregates many
official-agency-published articles, which covers most of the same need.
**Possible implementation:** `app/services/rss_service.py` mirroring
`space_news_service.py`'s cache/normalize/fallback pattern, merged into
the same news pool with a `source_type: "rss"` flag.

---

## Medium Priority

### Multi-source event clustering ("Reported by N sources")
**Idea:** Group articles about the same real-world event across sources
into one "coverage" view instead of separate cards.
**Reason:** Was a signature idea in the Space Intelligence brief.
**Why deferred:** Real fuzzy title/entity matching is a non-trivial NLP
problem to do without false-positive clustering; a naive
exact-title-match approach would rarely fire given how differently
outlets phrase headlines.
**Possible implementation:** Start with a cheap heuristic — same primary
tag + published within a 6-hour window + Jaccard similarity on
title tokens above a threshold — and label the result as "possibly
related coverage" rather than a confident cluster.

### Protected `/admin/news-health` page
**Idea:** A dedicated internal dashboard showing SNAPI/Launch Library
2/cache health, gated from public access.
**Reason:** Requested for operational visibility.
**Why deferred:** The project has no authentication system at all — building
one just to gate a single diagnostic page would be a disproportionate
addition. `/api/space/health` already exposes the same non-sensitive
status information (no secrets, no internals) without needing auth.
**Possible implementation:** If an admin auth layer is ever added for
other reasons, wrap a small HTML view around the existing
`space_news_service.health_check()` / `launch_service.health_check()`
calls behind it.

### Beginner / Explorer / Expert reading modes
**Idea:** A global content-density toggle — simplified text for
beginners, full detail for "Explorer," equations and technical
terminology for "Expert."
**Reason:** Would let one page serve very different audiences.
**Why deferred:** This is a content-authoring problem more than an
engineering one — it effectively requires writing 2–3 versions of the
explanatory text on every planet/moon/lab page, which is a large content
project on its own.
**Possible implementation:** Add an optional `expert_note` field to the
relevant JSON records (starting with planets and labs) and a body-level
CSS class toggled by a Settings option that shows/hides `[data-expert]`
blocks — additive to the data files, no template restructuring needed.

### Equation Mode
**Idea:** An optional toggle showing the underlying formulas (F =
Gm₁m₂/r², t = d/c, the Lorentz factor, Kepler's third law) inline on the
relevant labs.
**Reason:** Requested for advanced users; several labs (Gravity, Signal,
Relativity) already compute with these formulas server/client-side, just
without displaying them.
**Why deferred:** Scoped out of the last labs-building pass to keep that
addition bounded; genuinely low-risk and cheap to add later.
**Possible implementation:** A small `<details>` block per lab panel
with the formula and a one-line variable legend, shown only when a
`data-setting="equationMode"` toggle is enabled in Settings.

### Image format optimization (WebP/AVIF) for news thumbnails
**Idea:** Serve space-news images in a modern format at appropriate
sizes.
**Reason:** External news images are the single largest asset class the
app now loads (via `<img src="{news.image_url}">`).
**Why deferred:** These images are hotlinked directly from each news
source's CDN (SNAPI doesn't re-host or provide format variants) — COSMOS
doesn't control their format or size, and downloading/re-encoding
third-party editorial images server-side raises its own copyright and
infrastructure questions.
**Possible implementation:** If this becomes a real problem, a thin
image-proxy endpoint (`/api/news/image-proxy?url=...`) could fetch,
resize, and re-encode on the fly with server-side caching — meaningful
new infrastructure, not a quick fix.

---

## Low Priority

### PWA / offline shell / service worker
**Idea:** Make COSMOS installable with an offline app shell.
**Reason:** Was explicitly requested in an earlier feature pass.
**Why deferred:** The core educational content (planets, labs,
calculators, comparison) already works without any network calls per
page load beyond the initial HTML/CSS/JS — the main things that
*wouldn't* work offline are Space Intelligence's live news/launches,
which are inherently online-only by nature. A service worker mainly
buys install-ability and asset pre-caching, which matters more for a
mobile-app-replacement use case than this project's current form.
**Possible implementation:** A minimal `manifest.json` + service worker
caching `static/` assets and the shell HTML, falling back to a cached
shell when navigation requests fail.

### Procedural Universe / Galaxy Generator (abstract stat generators)
**Idea:** "Generate a fictional universe/galaxy" tools producing
star-count/galaxy-count statistics with a seed.
**Reason:** Requested in an earlier feature pass alongside the Planet
Generator.
**Why deferred:** The site already has a *real* 3D spiral-galaxy
visualization (`/galaxy`) and a fully-realized Procedural Planet
Generator with a save/load archive — an abstract number-generating
"universe" or "galaxy" tool would mostly duplicate that visual/interaction
pattern with less payoff, since it wouldn't render anything new.
**Possible implementation:** If pursued, reuse
`static/js/core/textures.js`'s spiral-galaxy point-cloud approach
(already built for `/galaxy`) parameterized by user sliders, rather than
building a second unrelated generator.

### Collision / Black Hole (deep) / Terraforming / Atmosphere / SETI /
Cosmic Noise / Pulsar / Neutron Star / Cosmic Ray labs
**Idea:** Several more physics labs from the original "COSMOS Labs"
brief (14 were requested; 9 were built).
**Reason:** Each is individually reasonable and matches the labs
pattern already established.
**Why deferred:** Nine labs already cover the highest-value, most
distinct physics concepts (gravity, orbits, eclipses, moon phases,
seasons, light-speed/communication delay, habitability, stellar
evolution, relativity) without visual/conceptual overlap. The remaining
five would start overlapping in presentation style (Pulsar/Neutron
Star/Cosmic Ray are all "spinning/particle" visualizations similar to
already-built labs) for diminishing educational distinctiveness per
labs.
**Possible implementation:** Each would follow the exact established
pattern — a new tab in `templates/labs.html`, a new module in
`static/js/labs/`, registered in `static/js/pages/labs.js`.

### Virtual Observatory / "tonight's sky" real calculation
**Idea:** Given a date/time/location, show which planets/constellations
are actually visible.
**Reason:** Requested twice across feature passes.
**Why deferred:** Doing this credibly requires a real ephemeris
calculation (or a library like `astropy`/`skyfield`) — faking planet
positions would directly violate the project's own "never fabricate
live/scientific data" rule repeated throughout every prompt in this
project's history. This is a "do it right or don't do it" feature.
**Possible implementation:** Add `skyfield` (pure-Python, no heavy
compiled deps) as a dependency, compute real topocentric positions
server-side for a given lat/lon/datetime, cache per-hour (positions
don't change fast enough to need finer caching), clearly label the
result as calculated (not observed).

### Cosmic photography / "clean view" screenshot mode
**Idea:** A mode that hides all UI chrome over a 3D scene for a clean
screenshot.
**Reason:** Nice-to-have for sharing/portfolio use.
**Why deferred:** Low value relative to build cost; browsers already
have built-in screenshot tools, and the `document.fullscreenElement`
Observatory Mode (already built) gets most of the way there by hiding
nav/footer/HUD.
**Possible implementation:** A body class toggled by a keyboard shortcut
that additionally hides the Mission HUD and any lab control panels,
layered on top of the existing Observatory Mode CSS rules.

### Easter eggs
**Idea:** A few hidden discoveries (secret asteroid, developer message,
a "42" reference).
**Reason:** Requested for delight/discovery value.
**Why deferred:** Explicitly a "nice to have, don't let it compromise
anything else" item in its original request — never prioritized over
functional features, and now out of scope for a feature-freeze polish
pass.
**Possible implementation:** A single small, self-contained module
(e.g. a Konami-code listener in `main.js`) so it can't affect anything
else if added later.

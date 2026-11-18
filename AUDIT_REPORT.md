# COSMOS Explorer audit

## Scope

Reviewed the Flask app, JavaScript rendering and settings, API services, static data, deployment configuration, and existing tests. The supplied master prompt ends in the middle of Phase 6, so this report covers the requirements present in the supplied text and the specific follow-up requests (IST display and sound controls).

## Findings addressed

- Production configuration previously allowed a known weak fallback secret. Production now fails closed unless `SECRET_KEY` is set to a sufficiently long value; development and test keys remain scoped to their environments. `.env` loading now matches the documented setup.
- Space news and launch feeds are external input. Renderers now escape displayed values, encode identifiers, and allow only HTTP(S) links. The news source filter no longer injects the URL query value into HTML.
- Arbitrary search terms could grow the process cache without a bound. The cache now caps entries and removes expired/old entries when full.
- API request limits and calculator validation now reject oversized searches and non-finite values; negative quiz limits are clamped. Feed parsing handles malformed response shapes without failing the whole page.
- Planetary music is a soft, original Web Audio ambient soundscape, off by default. Its control reports state to assistive technology, explains the soundtrack in its tooltip/settings text, stays synchronized with the settings panel, and resumes suspended audio after a user gesture.
- Visible clock, space news/launch publication times, update times, and journal dates use Asia/Kolkata and show the `IST` label. Timestamps remain stored as UTC instants where appropriate.
- Requirements now select Flask 3.1.3 and supported Gunicorn 27.x. Gunicorn 23.0.0 is no longer listed as supported by its maintainers; the installed local test environment still has Flask 3.0.3/Gunicorn 23, so the dependency upgrade itself requires a clean deployment install to validate.

## Verification

- Python suite: 177 passed.
- JavaScript security/formatting tests: 4 passed.
- JavaScript syntax checks: passed.
- Python bytecode compilation, static JSON parsing, `pip check`, and `git diff --check`: passed.

## Remaining limits

- The repository has no browser automation suite or CI workflow. Browser checks so far are representative Chromium checks, not a full physical-device or cross-browser matrix.
- `pip-audit` is not installed in the available environment, so no complete third-party CVE scan was produced.
- No database, authentication, payment processing, or private user data workflows were present in the reviewed app.
- A full QA pass against later phases cannot be claimed because the attached master prompt was truncated during Phase 6.

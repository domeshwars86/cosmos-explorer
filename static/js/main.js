/**
 * Global site behavior shared by every page: sticky nav, mobile menu,
 * loading screen sequence, settings panel, global search, tooltips,
 * scroll-reveal animations, cursor fx, fullscreen toggle, and a tiny
 * synthesized UI sound (no audio files needed, off by default, never
 * autoplays without interaction — MASTER PROMPT §56).
 */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------------
   * Loading screen
   * ------------------------------------------------------------------- */
  function initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    const statusEl = $('.loader-status', screen);
    const fillEl = $('.loader-bar-fill', screen);
    const steps = [
      'Initializing navigation systems…',
      'Loading star map…',
      'Loading planetary data…',
      'Calibrating orbital simulation…',
    ];
    let i = 0;
    const stepMs = 260;
    const interval = setInterval(() => {
      i++;
      if (statusEl && steps[i]) statusEl.textContent = steps[i];
      if (fillEl) fillEl.style.width = `${Math.min(100, (i / steps.length) * 100)}%`;
      if (i >= steps.length) {
        clearInterval(interval);
        finish();
      }
    }, stepMs);
    if (statusEl) statusEl.textContent = steps[0];

    function finish() {
      if (fillEl) fillEl.style.width = '100%';
      setTimeout(() => {
        screen.classList.add('hidden');
        screen.addEventListener('transitionend', () => screen.remove(), { once: true });
        setTimeout(() => screen.remove(), 900);
      }, 180);
    }

    // Never block longer than ~2.2s total, and skip entirely if the user
    // already saw it this session (avoids an artificially long repeat load).
    if (sessionStorage.getItem('cosmos:loaded-once')) {
      clearInterval(interval);
      screen.remove();
      return;
    }
    sessionStorage.setItem('cosmos:loaded-once', '1');
    setTimeout(finish, 2200);
  }

  /* ---------------------------------------------------------------------
   * Sticky nav + mobile menu
   * ------------------------------------------------------------------- */
  function initNav() {
    const nav = document.getElementById('site-nav');
    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        links.classList.toggle('mobile-open', !expanded);
      });
      $$('#nav-links a').forEach((a) => a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('mobile-open');
      }));
    }

    // Mark current page active
    const path = window.location.pathname;
    $$('#nav-links a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === path || (href !== '/' && path.startsWith(href))) a.classList.add('active');
    });
  }

  /* ---------------------------------------------------------------------
   * Settings panel
   * ------------------------------------------------------------------- */
  function initSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const openBtn = document.getElementById('settings-toggle');
    const closeBtn = document.getElementById('settings-close');
    const backdrop = document.getElementById('overlay-backdrop');
    if (!panel || !window.COSMOS?.settings) return;

    const settings = window.COSMOS.settings;

    function open() {
      panel.classList.add('open');
      backdrop?.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    }
    function close() {
      panel.classList.remove('open');
      if (!document.getElementById('search-overlay')?.classList.contains('open')) backdrop?.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', () => { close(); closeSearch(); });

    const current = settings.get();
    $$('[data-setting]', panel).forEach((input) => {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') {
        input.checked = !!current[key];
        input.addEventListener('change', () => settings.set({ [key]: input.checked }));
      } else if (input.tagName === 'SELECT') {
        input.value = current[key];
        input.addEventListener('change', () => settings.set({ [key]: input.value }));
      }
    });

    const resetBtn = document.getElementById('settings-reset');
    resetBtn?.addEventListener('click', () => {
      const fresh = settings.reset();
      $$('[data-setting]', panel).forEach((input) => {
        const key = input.dataset.setting;
        if (input.type === 'checkbox') input.checked = !!fresh[key];
        else if (input.tagName === 'SELECT') input.value = fresh[key];
      });
    });

    renderExplorationLog();
    document.getElementById('exploration-reset')?.addEventListener('click', () => {
      window.COSMOS?.achievements?.reset();
      renderExplorationLog();
    });
    // Re-render whenever the panel is opened, since progress may have
    // changed on a different page during this browsing session.
    openBtn?.addEventListener('click', renderExplorationLog);
  }

  function renderExplorationLog() {
    const grid = document.getElementById('exploration-log-grid');
    const badgesEl = document.getElementById('achievement-badges');
    if (!grid || !window.COSMOS?.achievements) return;
    const progress = window.COSMOS.achievements.getProgress();
    grid.innerHTML = `
      <div class="exploration-log-item"><div class="log-label">Planets</div><div class="log-value">${progress.planets.done} / ${progress.planets.total}</div></div>
      <div class="exploration-log-item"><div class="log-label">Moons</div><div class="log-value">${progress.moons.done} / ${progress.moons.total}</div></div>
    `;
    badgesEl.innerHTML = progress.achievements.map((a) => `<span class="achievement-badge ${a.unlocked ? 'unlocked' : ''}" title="${escapeHtml(a.desc)}">${a.unlocked ? '✦ ' : ''}${a.title}</span>`).join('');
  }

  /* ---------------------------------------------------------------------
   * Global search
   * ------------------------------------------------------------------- */
  let searchAbort = null;
  function closeSearch() {
    const overlay = document.getElementById('search-overlay');
    const backdrop = document.getElementById('overlay-backdrop');
    overlay?.classList.remove('open');
    if (!document.getElementById('settings-panel')?.classList.contains('open')) backdrop?.classList.remove('open');
  }

  function initSearch() {
    const overlay = document.getElementById('search-overlay');
    const backdrop = document.getElementById('overlay-backdrop');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const openBtns = $$('[data-search-open]');
    if (!overlay || !input || !results) return;

    function open() {
      overlay.classList.add('open');
      backdrop?.classList.add('open');
      setTimeout(() => input.focus(), 60);
    }

    openBtns.forEach((b) => b.addEventListener('click', open));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(); }
      if (e.key === 'Escape') { closeSearch(); document.getElementById('settings-panel')?.classList.remove('open'); }
    });

    function render(items, query) {
      if (!query) {
        results.innerHTML = '<div class="search-empty">Try "Europa", "Mars", "Titan", or "black hole"…</div>';
        return;
      }
      if (!items.length) {
        results.innerHTML = `<div class="search-empty">No results for "${escapeHtml(query)}".</div>`;
        return;
      }
      results.innerHTML = items.map((r) => `
        <a class="search-result" href="${r.url}">
          <span class="type-badge">${escapeHtml(r.type)}</span>
          <span class="stack">
            <span class="r-name">${escapeHtml(r.name)}</span>
            <span class="r-desc">${escapeHtml(r.description || '')}</span>
          </span>
        </a>
      `).join('');
    }

    render([], '');

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      debounceTimer = setTimeout(async () => {
        if (!q) { render([], ''); return; }
        try {
          if (searchAbort) searchAbort.abort();
          searchAbort = new AbortController();
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: searchAbort.signal });
          const body = await res.json();
          render(body.data?.results || [], q);
        } catch (err) {
          if (err.name !== 'AbortError') render([], q);
        }
      }, 180);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  /* ---------------------------------------------------------------------
   * Scroll-reveal animations (IntersectionObserver)
   * ------------------------------------------------------------------- */
  function initReveal() {
    const targets = $$('.reveal, .stat-card, .timeline-item');
    if (!targets.length) return;
    if (window.COSMOS?.settings?.get()?.reducedMotion) {
      targets.forEach((t) => t.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------------------------------------------------------------------
   * Tooltip bubbles for .term elements (data-tooltip attribute)
   * ------------------------------------------------------------------- */
  function initTooltips() {
    $$('.term[data-tooltip]').forEach((el) => {
      if ($('.tooltip-bubble', el)) return;
      const bubble = document.createElement('span');
      bubble.className = 'tooltip-bubble';
      bubble.setAttribute('role', 'tooltip');
      bubble.textContent = el.dataset.tooltip;
      el.appendChild(bubble);
      el.setAttribute('tabindex', '0');
    });
  }

  /* ---------------------------------------------------------------------
   * Cursor fx (desktop / fine-pointer only)
   * ------------------------------------------------------------------- */
  function initCursorFx() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.COSMOS?.settings?.get()?.reducedMotion) return;
    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener('mouseover', (e) => {
      const interactive = e.target.closest('a, button, .card, .compare-chip, .moon-card, [role="button"]');
      ring.classList.toggle('hover', !!interactive);
    });
  }

  /* ---------------------------------------------------------------------
   * Fullscreen toggle
   * ------------------------------------------------------------------- */
  function initFullscreen() {
    const btn = document.getElementById('fullscreen-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      btn.classList.toggle('active', isFullscreen);
      document.body.classList.toggle('observatory-mode', isFullscreen);
    });
  }

  /* ---------------------------------------------------------------------
   * Synthesized UI sound (Web Audio API — no audio files required)
   * ------------------------------------------------------------------- */
  function initSound() {
    const btn = document.getElementById('sound-toggle');
    let ctx = null;
    function ensureCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }
    function blip(freq = 660, duration = 0.06) {
      if (!window.COSMOS?.settings?.get()?.soundOn) return;
      try {
        const audio = ensureCtx();
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, audio.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, audio.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
        osc.connect(gain).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + duration + 0.02);
      } catch (err) { /* audio unavailable — fail silently */ }
    }
    window.COSMOS = window.COSMOS || {};
    window.COSMOS.blip = blip;

    if (btn) {
      const sync = () => btn.setAttribute('aria-pressed', String(!!window.COSMOS.settings.get().soundOn));
      sync();
      btn.addEventListener('click', () => {
        const next = !window.COSMOS.settings.get().soundOn;
        window.COSMOS.settings.set({ soundOn: next });
        sync();
        if (next) blip(880, 0.08);
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.closest('button, a.btn, .compare-chip, .tab-btn')) blip(520, 0.045);
    });
  }

  /* ---------------------------------------------------------------------
   * "Take Me Somewhere" — jumps to a random, interesting destination.
   * ------------------------------------------------------------------- */
  function initTakeMeSomewhere() {
    const btn = document.getElementById('take-me-somewhere');
    if (!btn) return;

    const DESTINATIONS = [
      { url: '/planet/mars', label: 'Mars' },
      { url: '/planet/jupiter', label: 'Jupiter' },
      { url: '/planet/saturn', label: 'Saturn' },
      { url: '/planet/neptune', label: 'Neptune' },
      { url: '/planet/venus', label: 'Venus' },
      { url: '/moon/europa', label: 'Europa' },
      { url: '/moon/titan', label: 'Titan' },
      { url: '/moon/triton', label: 'Triton' },
      { url: '/moon/moon', label: 'The Moon' },
      { url: '/sun', label: 'The Sun' },
      { url: '/galaxy#black-hole', label: 'Sagittarius A*' },
      { url: '/galaxy', label: 'The Milky Way' },
      { url: '/galaxy#scale', label: 'The Observable Universe' },
      { url: '/dwarf-planet/pluto', label: 'Pluto' },
      { url: '/explore#voyager', label: 'Voyager' },
    ];

    btn.addEventListener('click', () => {
      const pool = DESTINATIONS.filter((d) => !window.location.pathname.startsWith(d.url.split('#')[0]));
      const pick = (pool.length ? pool : DESTINATIONS)[Math.floor(Math.random() * (pool.length ? pool.length : DESTINATIONS.length))];

      const curtain = document.createElement('div');
      curtain.style.cssText = 'position:fixed;inset:0;z-index:950;background:#05060c;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .35s ease;font-family:var(--font-heading);letter-spacing:0.25em;font-size:0.95rem;color:#e9ecf7;';
      curtain.textContent = `WARPING TO ${pick.label.toUpperCase()}…`;
      document.body.appendChild(curtain);
      requestAnimationFrame(() => { curtain.style.opacity = '1'; });
      window.COSMOS?.blip?.(440, 0.1);
      setTimeout(() => { window.location.href = pick.url; }, 550);
    });
  }

  /* ---------------------------------------------------------------------
   * Random fact widget (used on multiple pages)
   * ------------------------------------------------------------------- */
  function initFactWidget() {
    const btn = document.getElementById('fact-generator-btn');
    const textEl = document.getElementById('fact-text');
    if (!btn || !textEl) return;
    async function roll() {
      btn.disabled = true;
      try {
        const res = await fetch('/api/facts/random');
        const body = await res.json();
        textEl.style.opacity = 0;
        setTimeout(() => {
          textEl.textContent = body.data?.fact || 'The universe is vast.';
          textEl.style.opacity = 1;
        }, 180);
      } catch (err) {
        textEl.textContent = 'Unable to reach mission control. Try again.';
      } finally {
        setTimeout(() => { btn.disabled = false; }, 250);
      }
    }
    btn.addEventListener('click', roll);
  }

  function init() {
    initLoadingScreen();
    initNav();
    initSettingsPanel();
    initSearch();
    initReveal();
    initTooltips();
    initCursorFx();
    initFullscreen();
    initSound();
    initFactWidget();
    initTakeMeSomewhere();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

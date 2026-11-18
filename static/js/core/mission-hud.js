/**
 * Mission Control HUD — a single, collapsible, persistent widget combining
 * three related ideas from the enhancement brief into one unobtrusive
 * element instead of three separate floating widgets: your location within
 * the cosmic hierarchy (Milky Way → Orion Spur → Solar System → current
 * object), a live UTC clock, and a small system-status readout. The clock
 * shows real current time; the "system status" lines reflect this page's
 * actual state (WebGL support, API reachability) rather than fabricated
 * telemetry.
 */
(function () {
  'use strict';

  function currentLeaf() {
    const path = window.location.pathname;
    const m = path.match(/^\/planet\/([a-z]+)/);
    if (m) return { label: m[1].charAt(0).toUpperCase() + m[1].slice(1), url: path };
    if (path.startsWith('/sun')) return { label: 'The Sun', url: '/sun' };
    if (path.startsWith('/moon/')) return { label: document.title.split('—')[0].trim() || 'Moon', url: path };
    if (path.startsWith('/dwarf-planet')) return { label: 'Dwarf Planets', url: '/dwarf-planets' };
    if (path.startsWith('/galaxy')) return null; // Milky Way is already the deepest crumb
    if (path === '/' || path.startsWith('/solar-system')) return { label: 'Solar System', url: '/solar-system', skipDuplicate: true };
    return { label: 'COSMOS Interface', url: null };
  }

  function buildBreadcrumb() {
    const leaf = currentLeaf();
    const crumbs = [
      { label: 'Milky Way', url: '/galaxy' },
      { label: 'Orion Spur', url: '/galaxy' },
      { label: 'Solar System', url: '/solar-system' },
    ];
    if (leaf && !leaf.skipDuplicate) crumbs.push(leaf);
    const onGalaxy = window.location.pathname.startsWith('/galaxy');

    return crumbs.map((c, i) => {
      const isCurrent = (i === crumbs.length - 1) || (onGalaxy && i === 0);
      return `<button type="button" class="${isCurrent ? 'current' : ''}" data-href="${c.url || ''}" ${c.url ? '' : 'disabled'}>${' '.repeat(i)}${i > 0 ? '└ ' : ''}${c.label}</button>`;
    }).join('');
  }

  function formatClock(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase()} ${d.getUTCFullYear()}`,
      time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`,
    };
  }

  async function checkApiStatus() {
    try {
      const res = await fetch('/api/planets', { method: 'GET' });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  function init() {
    if (document.getElementById('mission-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'mission-hud';
    const hudPreference = localStorage.getItem('cosmos:hud-collapsed');
    const collapsedStored = hudPreference === '1' ||
      (hudPreference === null && window.matchMedia('(max-width: 600px)').matches);
    if (collapsedStored) hud.classList.add('collapsed');

    hud.innerHTML = `
      <div class="hud-header" id="hud-toggle" role="button" tabindex="0" aria-expanded="${!collapsedStored}" aria-controls="hud-body">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="hud-title">Mission Control</span>
        <span class="hud-chevron" aria-hidden="true">▾</span>
      </div>
      <div class="hud-body" id="hud-body">
        <div class="hud-section hud-breadcrumb" id="hud-breadcrumb"></div>
        <div class="hud-section">
          <div class="hud-row"><span>Sim. Date</span><b id="hud-date">—</b></div>
          <div class="hud-row"><span>Time</span><b id="hud-time">—</b></div>
        </div>
        <div class="hud-section">
          <div class="hud-row"><span>3D Engine</span><b id="hud-webgl">—</b></div>
          <div class="hud-row"><span>Data Link</span><b id="hud-api">Checking…</b></div>
        </div>
      </div>
    `;
    document.body.appendChild(hud);

    document.getElementById('hud-breadcrumb').innerHTML = buildBreadcrumb();
    hud.querySelectorAll('[data-href]').forEach((btn) => {
      const href = btn.dataset.href;
      if (href) btn.addEventListener('click', () => { window.location.href = href; });
    });

    const toggle = document.getElementById('hud-toggle');
    function setCollapsed(collapsed) {
      hud.classList.toggle('collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      localStorage.setItem('cosmos:hud-collapsed', collapsed ? '1' : '0');
    }
    toggle.addEventListener('click', () => setCollapsed(!hud.classList.contains('collapsed')));
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(!hud.classList.contains('collapsed')); }
    });

    const dateEl = document.getElementById('hud-date');
    const timeEl = document.getElementById('hud-time');
    function tick() {
      const { date, time } = formatClock(new Date());
      dateEl.textContent = date;
      timeEl.textContent = time;
    }
    tick();
    setInterval(tick, 1000);

    document.getElementById('hud-webgl').textContent = window.COSMOS?.hasWebGL ? 'Online' : 'Unavailable';
    checkApiStatus().then((ok) => {
      const el = document.getElementById('hud-api');
      el.textContent = ok ? 'Online' : 'Offline';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

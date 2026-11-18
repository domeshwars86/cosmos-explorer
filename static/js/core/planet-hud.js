/**
 * Two small, related additions to every Sun / planet / moon / dwarf planet
 * detail page: a collapsible in-view stat HUD (so key numbers are visible
 * without scrolling past the 3D model), and a "Scan" button that plays a
 * short sweep animation before revealing a short Detected/Not Detected/
 * Estimated readout. This is an educational visualization, not a live
 * scientific instrument — every status below is a fixed, hand-curated
 * summary of real published findings, clearly framed as such in the UI.
 */
import { compactKm } from './format.js';

const SCAN_KNOWLEDGE = {
  mercury: { atmosphere: 'not-detected', water: 'estimated', magnetic: 'detected', life: 'not-detected' },
  venus: { atmosphere: 'detected', water: 'not-detected', magnetic: 'not-detected', life: 'not-detected' },
  earth: { atmosphere: 'detected', water: 'detected', magnetic: 'detected', life: 'detected' },
  mars: { atmosphere: 'detected', water: 'estimated', magnetic: 'not-detected', life: 'unknown' },
  jupiter: { atmosphere: 'detected', water: 'unknown', magnetic: 'detected', life: 'not-detected' },
  saturn: { atmosphere: 'detected', water: 'unknown', magnetic: 'detected', life: 'not-detected' },
  uranus: { atmosphere: 'detected', water: 'unknown', magnetic: 'detected', life: 'not-detected' },
  neptune: { atmosphere: 'detected', water: 'unknown', magnetic: 'detected', life: 'not-detected' },
  moon: { atmosphere: 'not-detected', water: 'estimated', magnetic: 'not-detected', life: 'not-detected' },
  europa: { atmosphere: 'not-detected', water: 'estimated', magnetic: 'detected', life: 'unknown' },
  enceladus: { atmosphere: 'not-detected', water: 'detected', magnetic: 'unknown', life: 'unknown' },
  titan: { atmosphere: 'detected', water: 'not-detected', magnetic: 'not-detected', life: 'unknown' },
};

const STATUS_LABEL = { detected: 'DETECTED', 'not-detected': 'NOT DETECTED', estimated: 'ESTIMATED', unknown: 'UNKNOWN / NOT MODELED' };
const STATUS_CLASS = { detected: 'detected', 'not-detected': 'not-detected', estimated: 'unknown', unknown: 'unknown' };

function normalizeStats(kind, data) {
  if (kind === 'sun') {
    return {
      title: data.name, subtitle: `${data.category} · ${data.type}`,
      rows: [
        ['Diameter', `${compactKm(data.stats.diameter_km)} km`],
        ['Surface Temp', `${data.stats.surface_temp_c}°C`],
        ['Gravity', `${data.stats.gravity_ms2} m/s²`],
      ],
    };
  }
  if (kind === 'moon' || kind === 'dwarf') {
    const diameter = data.diameter_km;
    return {
      title: data.name,
      subtitle: kind === 'moon' ? `Moon of ${data.parent ? data.parent[0].toUpperCase() + data.parent.slice(1) : ''}` : 'Dwarf Planet',
      rows: [
        ['Diameter', `${compactKm(diameter)} km`],
        ['Gravity', `${data.gravity_ms2} m/s²`],
        ['Orbit', `${data.orbital_period_days ?? data.orbital_period_days} d`],
      ],
    };
  }
  return {
    title: data.name, subtitle: `${data.category} · ${data.position_label}`,
    rows: [
      ['Distance', `${compactKm(data.stats.distance_km)} km`],
      ['Gravity', `${data.stats.gravity_ms2} m/s²`],
      ['Moons', `${data.stats.moons}`],
      ['Orbit', `${data.stats.orbital_period_days} d`],
    ],
  };
}

export function mountPlanetHud(kind, data) {
  const wrap = document.querySelector('.hero-canvas-wrap');
  if (!wrap) return;

  const info = normalizeStats(kind, data);
  const collapsedKey = 'cosmos:planet-hud-collapsed';
  const hudPreference = localStorage.getItem(collapsedKey);
  const collapsed = hudPreference === '1' ||
    (hudPreference === null && window.matchMedia('(max-width: 600px)').matches);

  const alreadySaved = window.COSMOS?.journal?.isSaved(window.location.pathname);
  const hud = document.createElement('div');
  hud.className = `planet-hud${collapsed ? ' collapsed' : ''}`;
  hud.innerHTML = `
    <div class="panel">
      <div class="hud-header" id="phud-toggle" role="button" tabindex="0" aria-expanded="${!collapsed}">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="hud-title">${info.title}</span>
        <span class="hud-chevron" aria-hidden="true">▾</span>
      </div>
      <div class="hud-body">
        <div class="hud-section"><p class="text-muted" style="font-size:0.72rem; margin-bottom:0.4rem;">${info.subtitle}</p></div>
        <div class="hud-section">
          ${info.rows.map(([label, value]) => `<div class="hud-row"><span>${label}</span><b>${value}</b></div>`).join('')}
        </div>
        <div class="hud-section">
          <button type="button" class="btn btn-sm btn-outline" id="phud-journal" style="width:100%;">${alreadySaved ? '✓ Saved to Journal' : '+ Save to Journal'}</button>
        </div>
      </div>
    </div>`;
  wrap.appendChild(hud);

  const journalBtn = hud.querySelector('#phud-journal');
  if (alreadySaved) journalBtn.disabled = true;
  journalBtn.addEventListener('click', () => {
    const saved = window.COSMOS?.journal?.save({ name: data.name, url: window.location.pathname, why: data.short_description || data.description || '' });
    if (saved) {
      journalBtn.textContent = '✓ Saved to Journal';
      journalBtn.disabled = true;
      window.COSMOS?.blip?.(760, 0.09);
    }
  });

  const toggle = hud.querySelector('#phud-toggle');
  function setCollapsed(v) {
    hud.classList.toggle('collapsed', v);
    toggle.setAttribute('aria-expanded', String(!v));
    localStorage.setItem(collapsedKey, v ? '1' : '0');
  }
  toggle.addEventListener('click', () => setCollapsed(!hud.classList.contains('collapsed')));
  toggle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollapsed(!hud.classList.contains('collapsed')); } });

  mountScan(wrap, kind, data);
}

function mountScan(wrap, kind, data) {
  const fx = document.createElement('div');
  fx.className = 'scan-overlay-fx';
  wrap.appendChild(fx);

  const btnRow = document.createElement('div');
  btnRow.className = 'scan-btn-row';
  btnRow.innerHTML = `<button type="button" class="btn btn-outline btn-sm" id="scan-btn">Scan ${data.name}</button>`;
  wrap.appendChild(btnRow);

  const resultsHost = document.getElementById('scan-results-host');
  const knowledge = SCAN_KNOWLEDGE[data.id] || { atmosphere: 'unknown', water: 'unknown', magnetic: 'unknown', life: 'not-detected' };

  document.getElementById('scan-btn').addEventListener('click', function scan() {
    const btn = this;
    btn.disabled = true;
    btn.textContent = 'Scanning…';
    fx.classList.add('active');
    window.COSMOS?.blip?.(300, 0.12);

    setTimeout(() => {
      fx.classList.remove('active');
      btn.textContent = `Scan ${data.name} Again`;
      btn.disabled = false;
      if (resultsHost) {
        resultsHost.classList.remove('hidden');
        resultsHost.innerHTML = `
          <h4 style="margin-bottom:0.4rem;">Planetary Scan Complete</h4>
          <p class="text-muted" style="font-size:0.78rem; margin-bottom:0.8rem;">Educational summary of published findings — not a live instrument reading.</p>
          ${row('Atmosphere', knowledge.atmosphere)}
          ${row('Liquid / Surface Water', knowledge.water)}
          ${row('Magnetic Field', knowledge.magnetic)}
          ${row('Known Life', knowledge.life)}
        `;
        resultsHost.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1800);
  });
}

function row(label, status) {
  return `<div class="scan-row"><span>${label}</span><span class="scan-status ${STATUS_CLASS[status]}">${STATUS_LABEL[status]}</span></div>`;
}

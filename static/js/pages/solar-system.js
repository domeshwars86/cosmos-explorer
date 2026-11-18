/**
 * Full Solar System simulator: play/pause, speed control, visualization
 * modes, orbit/label toggles, click-for-info panel, and camera reset.
 */
import { createOrrery } from '../core/orrery.js';

const MODE_NOTES = {
  visual: 'Visual Mode — orbits are evenly spaced for legibility and planet sizes are compressed. Not physically to scale.',
  size: 'Size Comparison Mode — planet sizes are shown at accurate relative scale to each other. Orbit spacing is still simplified.',
  distance: 'Distance Mode — orbit radii are scaled (logarithmically, to fit the screen) from real average distance from the Sun. Planet sizes are shrunk for legibility.',
  scientific: 'Scientific Mode — same distance scaling as above, with real statistics shown when you select a planet. Even this mode compresses distance for display; see each planet\'s page for exact figures.',
};

async function fetchSolarSystem() {
  const res = await fetch('/api/solar-system');
  const body = await res.json();
  return body.data;
}

function formatStat(label, value, unit) {
  return `<span>${label}</span><b>${value}${unit ? ' ' + unit : ''}</b>`;
}

function showFallback() {
  const root = document.getElementById('sim-root');
  if (!root) return;
  root.innerHTML = `
    <div class="webgl-fallback panel" style="width:100%;">
      <div class="fallback-orb" style="background:radial-gradient(circle at 35% 30%, #fff, #ffb13b 45%, #10121e 100%);"></div>
      <h3>3D Simulation Unavailable</h3>
      <p class="text-secondary" style="margin-top:0.6rem;">Your browser does not support WebGL. Explore each planet's data directly from the list below.</p>
    </div>`;
}

async function init() {
  const canvas = document.getElementById('sim-canvas');
  if (!canvas) return;

  // On phones, let visitors tuck the simulator controls away after adjusting them.
  const toolbar = document.querySelector('.sim-toolbar');
  const toolbarToggle = document.getElementById('sim-toolbar-toggle');
  toolbarToggle?.addEventListener('click', () => {
    const collapsed = toolbar.classList.toggle('is-collapsed');
    toolbarToggle.setAttribute('aria-expanded', String(!collapsed));
    const action = collapsed ? 'Expand' : 'Collapse';
    toolbarToggle.setAttribute('aria-label', `${action} simulation controls`);
    toolbarToggle.title = `${action} simulation controls`;
  });

  if (!window.COSMOS?.hasWebGL) { showFallback(); return; }

  let data;
  try {
    data = await fetchSolarSystem();
  } catch (err) {
    showFallback();
    return;
  }

  const settings = window.COSMOS.settings.get();
  const orrery = createOrrery(canvas, {
    sun: data.sun,
    planets: data.planets,
    interactive: true,
    autoRotate: false,
    mode: 'visual',
    showOrbits: settings.showOrbits,
    showLabels: settings.showLabels,
    compact: settings.performanceMode,
    onSelect: (id, planetData) => showInfo(id, planetData),
  });

  const infoPanel = document.getElementById('sim-info');
  const infoName = document.getElementById('sim-info-name');
  const infoStats = document.getElementById('sim-info-stats');
  const infoLink = document.getElementById('sim-info-link');

  function showInfo(id, p) {
    infoName.textContent = p.name;
    infoStats.innerHTML = [
      formatStat('Distance', (p.stats.distance_km / 1e6).toFixed(1), 'M km'),
      formatStat('Gravity', p.stats.gravity_ms2, 'm/s²'),
      formatStat('Orbit', p.stats.orbital_period_days, 'days'),
      formatStat('Moons', p.stats.moons, ''),
      formatStat('Temp', p.stats.temp_c_avg, '°C'),
      formatStat('Type', p.category, ''),
    ].join('');
    infoLink.href = `/planet/${id}`;
    infoPanel.classList.add('visible');
    orrery.focusOn(id);
  }

  // Mode switch
  const modeButtons = document.querySelectorAll('#mode-switch button');
  const modeNote = document.getElementById('mode-note');
  const modeBadge = document.getElementById('sim-mode-badge');
  const badgeLabel = { visual: 'Visual Mode', size: 'Size Comparison Mode', distance: 'Distance Mode', scientific: 'Scientific Mode' };
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const mode = btn.dataset.mode;
      orrery.setMode(mode);
      modeNote.textContent = MODE_NOTES[mode];
      modeBadge.textContent = `${badgeLabel[mode]} · not to scale`;
    });
  });

  // Toggles
  document.getElementById('toggle-orbits')?.addEventListener('change', (e) => orrery.setOrbitsVisible(e.target.checked));
  document.getElementById('toggle-labels')?.addEventListener('change', (e) => orrery.setLabelsVisible(e.target.checked));

  // Play / pause
  const playBtn = document.getElementById('sim-play');
  playBtn?.addEventListener('click', () => {
    const next = !orrery.isPlaying();
    orrery.setPlaying(next);
    playBtn.innerHTML = next
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  });

  // Speed
  document.getElementById('sim-speed')?.addEventListener('change', (e) => orrery.setSpeed(parseFloat(e.target.value)));

  // Reset — simplest reliable reset is reloading the orrery's camera via a full rebuild is heavy;
  // instead we just clear the focused target and let OrbitControls settle back on the origin.
  document.getElementById('sim-reset')?.addEventListener('click', () => {
    infoPanel.classList.remove('visible');
    orrery.focusOn(null);
  });

  window.addEventListener('cosmos:settings-changed', (e) => {
    orrery.setOrbitsVisible(e.detail.showOrbits);
    orrery.setLabelsVisible(e.detail.showLabels);
  });
}

init();

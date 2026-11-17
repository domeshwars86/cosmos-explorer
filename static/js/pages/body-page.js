/**
 * Mounts a single-body rotate/zoom 3D viewer on any page that defines
 * `window.__COSMOS_BODY__` (the body's data) and a `<canvas id="body-canvas"
 * data-kind="sun|planet|moon|dwarf">` element. Shared by the Sun, planet,
 * moon, and dwarf planet detail pages.
 */
import { createBodyViewer } from '../core/body-viewer.js';
import { mountPlanetHud } from '../core/planet-hud.js';
import { mountRecommendations } from '../core/recommendations.js';

function showFallback(canvas, data) {
  const wrap = canvas.parentElement;
  wrap.innerHTML = `
    <div class="webgl-fallback panel" style="width:100%; margin-top:2rem;">
      <div class="fallback-orb" style="background:radial-gradient(circle at 35% 30%, #fff, ${data.color || '#7c8cff'} 45%, #10121e 100%);"></div>
      <h3>3D View Unavailable</h3>
      <p class="text-secondary" style="margin-top:0.6rem;">Your browser does not support WebGL. All statistics and facts below remain fully available.</p>
    </div>`;
}

function init() {
  const canvas = document.getElementById('body-canvas');
  const data = window.__COSMOS_BODY__;
  if (!canvas || !data) return;

  if (!window.COSMOS?.hasWebGL) { showFallback(canvas, data); return; }

  const kind = canvas.dataset.kind || 'planet';
  const radius = kind === 'sun' ? 3.6 : kind === 'moon' || kind === 'dwarf' ? 1.9 : 2.4;

  try {
    const viewer = createBodyViewer(canvas, { kind, data, radius });
    window.addEventListener('cosmos:settings-changed', (e) => viewer.setAutoRotate(!e.detail.reducedMotion));
    if (window.COSMOS.settings.get().reducedMotion) viewer.setAutoRotate(false);
  } catch (err) {
    showFallback(canvas, data);
  }

  try {
    mountPlanetHud(kind, data);
  } catch (err) { /* HUD is a non-critical enhancement — never block the page over it */ }

  const eventByKind = { planet: 'visit_planet', sun: 'visit_sun', moon: 'visit_moon', dwarf: 'visit_dwarf' };
  window.COSMOS?.achievements?.track(eventByKind[kind] || 'visit_planet', { id: data.id });

  const recEl = document.getElementById('recommendations');
  if (recEl) mountRecommendations(recEl, kind, data.id);
}

init();

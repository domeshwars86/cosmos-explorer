/**
 * Homepage: hero orrery (click a planet to open its page) + a small
 * looping preview of the full simulator.
 */
import { createOrrery } from '../core/orrery.js';

async function fetchSolarSystem() {
  const res = await fetch('/api/solar-system');
  const body = await res.json();
  return body.data;
}

function showFallback(container, message) {
  container.innerHTML = `
    <div class="webgl-fallback panel">
      <div class="fallback-orb" style="background:radial-gradient(circle at 35% 30%, #fff, #7c8cff 45%, #10121e 100%);"></div>
      <h3>${message}</h3>
      <p class="text-secondary" style="margin-top:0.6rem;">Your browser does not support 3D visualization (WebGL). You can still explore every planet, its statistics, and comparisons throughout the site.</p>
      <a href="/solar-system" class="btn btn-outline" style="margin-top:1.2rem;">View Solar System Data</a>
    </div>`;
}

async function init() {
  const heroCanvas = document.getElementById('hero-canvas');
  const previewCanvas = document.getElementById('preview-canvas');
  if (!heroCanvas) return;

  if (!window.COSMOS?.hasWebGL) {
    showFallback(heroCanvas.parentElement, 'Solar System Preview Unavailable');
    document.getElementById('preview-simulator')?.parentElement?.classList.add('hidden');
    return;
  }

  let data;
  try {
    data = await fetchSolarSystem();
  } catch (err) {
    showFallback(heroCanvas.parentElement, 'Unable to Load Solar System Data');
    return;
  }

  const settings = window.COSMOS.settings.get();

  const hero = createOrrery(heroCanvas, {
    sun: data.sun,
    planets: data.planets,
    interactive: true,
    autoRotate: !settings.reducedMotion,
    mode: 'visual',
    showOrbits: settings.showOrbits,
    showLabels: false,
    compact: settings.performanceMode,
    onSelect: (id) => { window.location.href = `/planet/${id}`; },
  });

  // Hover tag showing planet name near cursor
  const tag = document.createElement('div');
  tag.className = 'hero-planet-tag';
  tag.textContent = '';
  heroCanvas.parentElement.appendChild(tag);
  heroCanvas.addEventListener('pointermove', (e) => {
    const h = hero.getHovered();
    if (h) {
      tag.textContent = `${h.data.name} — click to explore`;
      tag.style.left = `${e.clientX}px`;
      tag.style.top = `${e.clientY - 26}px`;
      tag.classList.add('visible');
    } else {
      tag.classList.remove('visible');
    }
  });

  if (previewCanvas) {
    const preview = createOrrery(previewCanvas, {
      sun: data.sun,
      planets: data.planets,
      interactive: true,
      autoRotate: !settings.reducedMotion,
      mode: 'visual',
      showOrbits: true,
      showLabels: false,
      compact: true,
      onSelect: (id) => { window.location.href = `/planet/${id}`; },
    });
    const playBtn = document.getElementById('preview-play');
    playBtn?.addEventListener('click', () => {
      const next = !preview.isPlaying();
      preview.setPlaying(next);
      playBtn.innerHTML = next
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
    });
  }
}

init();

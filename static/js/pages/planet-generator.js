/**
 * Procedural Planet Generator — builds a live 3D preview from slider
 * inputs using the same procedural-texture toolkit as every real planet
 * on the site (static/js/core/textures.js), then runs a habitability
 * assessment using the same scoring methodology as the Habitability Lab.
 * Saved worlds are stored in localStorage only — this is a fictional
 * design tool, not a real astronomical catalog (MASTER PROMPT §29/§30).
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createRenderer, createStarField, createLoop, fitRendererToParent, disposeObject3D } from '../core/scene.js';
import { makeCrateredTexture, makeBandedTexture, makeCloudTexture } from '../core/textures.js';

const ARCHIVE_KEY = 'cosmos:my-worlds:v1';
const EARTH_GRAVITY = 9.81;

function readParams() {
  return {
    radiusPct: +document.getElementById('pg-radius').value,
    densityPct: +document.getElementById('pg-density').value,
    distanceAu: +document.getElementById('pg-distance').value / 10,
    waterPct: +document.getElementById('pg-water').value,
    cloudPct: +document.getElementById('pg-clouds').value,
    rotationHours: +document.getElementById('pg-rotation').value,
    tiltDeg: +document.getElementById('pg-tilt').value,
    atmosphere: document.getElementById('pg-atmosphere').value,
    terrain: document.getElementById('pg-terrain').value,
  };
}

const ATMOSPHERE_PRESSURE = { none: 0, thin: 30, earthlike: 100, thick: 250, toxic: 180 };
const ATMOSPHERE_GREENHOUSE_C = { none: -15, thin: -5, earthlike: 0, thick: 35, toxic: 90 };
const ATMOSPHERE_RADIATION = { none: 90, thin: 60, earthlike: 20, thick: 10, toxic: 40 };

function analyze(p) {
  const gravity = EARTH_GRAVITY * (p.radiusPct / 100) * (p.densityPct / 100);
  const yearDays = Math.sqrt(Math.pow(p.distanceAu, 3)) * 365.25;
  const baseTempC = 280 / Math.sqrt(p.distanceAu) - 273 + ATMOSPHERE_GREENHOUSE_C[p.atmosphere];

  const tempScore = baseTempC >= -20 && baseTempC <= 50 ? 1 : (baseTempC >= -60 && baseTempC < 100 ? 0.5 : 0);
  const pressureScore = ATMOSPHERE_PRESSURE[p.atmosphere] >= 50 && ATMOSPHERE_PRESSURE[p.atmosphere] <= 300 ? 1 : (ATMOSPHERE_PRESSURE[p.atmosphere] > 0 ? 0.5 : 0);
  const waterScore = p.waterPct / 100;
  const radiationScore = 1 - ATMOSPHERE_RADIATION[p.atmosphere] / 100;
  const habitabilityScore = tempScore * 0.3 + pressureScore * 0.2 + waterScore * 0.3 + radiationScore * 0.2;

  let habitability;
  if (habitabilityScore >= 0.75) habitability = 'Highly Favorable (Earth-like)';
  else if (habitabilityScore >= 0.5) habitability = 'Potentially Habitable';
  else if (habitabilityScore >= 0.25) habitability = 'Marginally Habitable';
  else habitability = 'Not Habitable';

  let worldType;
  if (p.atmosphere === 'none') worldType = 'Airless Rocky World';
  else if (baseTempC > 80 && p.atmosphere === 'thick') worldType = 'Hothouse World';
  else if (baseTempC < -50) worldType = 'Frozen World';
  else if (p.waterPct >= 55 && baseTempC >= -5 && baseTempC <= 45) worldType = 'Ocean World';
  else if (p.waterPct < 10 && baseTempC > 45) worldType = 'Scorched Desert World';
  else worldType = 'Terrestrial World';

  return { gravity, yearDays, baseTempC, habitability, worldType };
}

function worldColor(p, analysis) {
  if (analysis.worldType === 'Ocean World') return '#2a6fd6';
  if (analysis.worldType === 'Frozen World') return '#cfe6ff';
  if (analysis.worldType === 'Hothouse World') return '#e8b84a';
  if (analysis.worldType === 'Scorched Desert World') return '#b3502c';
  if (analysis.worldType === 'Airless Rocky World') return '#9c9c9c';
  return '#6fae5c';
}

function renderAnalysis(p, a) {
  const el = document.getElementById('pg-analysis');
  el.innerHTML = `
    <div class="stat-card in-view"><div class="stat-label">World Type</div><div class="stat-value" style="font-size:1.05rem;">${a.worldType}</div></div>
    <div class="stat-card in-view"><div class="stat-label">Gravity</div><div class="stat-value">${a.gravity.toFixed(2)}<span class="stat-unit">m/s²</span></div></div>
    <div class="stat-card in-view"><div class="stat-label">Avg. Temperature</div><div class="stat-value">${a.baseTempC.toFixed(0)}<span class="stat-unit">°C</span></div></div>
    <div class="stat-card in-view"><div class="stat-label">Day Length</div><div class="stat-value">${p.rotationHours}<span class="stat-unit">hrs</span></div></div>
    <div class="stat-card in-view"><div class="stat-label">Year Length</div><div class="stat-value" style="font-size:1.05rem;">${a.yearDays >= 365 ? (a.yearDays / 365.25).toFixed(1) + ' yrs' : a.yearDays.toFixed(0) + ' days'}</div></div>
    <div class="stat-card in-view"><div class="stat-label">Habitability</div><div class="stat-value" style="font-size:1rem;">${a.habitability}</div></div>
  `;
}

function init() {
  const canvas = document.getElementById('planet-gen-canvas');
  if (!canvas) return;

  let scene, camera, renderer, controls, mesh, cloudMesh, loopHandle;

  function build3D(p, a) {
    if (loopHandle) loopHandle.stop();
    if (controls) controls.dispose(); // this runs on every slider tweak — without disposing, each
    if (scene) { disposeObject3D(scene); renderer.dispose(); } // rebuild would stack another set of
    // OrbitControls mouse/touch listeners onto the same <canvas> for the life of the page.

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.2, 5.4);
    renderer = createRenderer(canvas);
    fitRendererToParent(renderer, camera);
    scene.add(createStarField(500, 200));
    scene.add(new THREE.AmbientLight(0x40405a, 0.6));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.8);
    key.position.set(4, 2, 5);
    scene.add(key);

    const color = worldColor(p, a);
    let map;
    if (p.terrain === 'cratered') map = makeCrateredTexture({ base: color, detail: shade(color, -0.3), highlight: shade(color, 0.3), seed: 'pg' });
    else if (p.terrain === 'mountainous' || p.terrain === 'volcanic') map = makeBandedTexture({ base: color, detail: shade(color, -0.35), highlight: shade(color, 0.25), seed: 'pg', bigSpot: p.terrain === 'volcanic', spotColor: '#ff5a1f' });
    else map = makeCrateredTexture({ base: color, detail: shade(color, -0.12), highlight: shade(color, 0.18), seed: 'pg-smooth' });

    const material = new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
    mesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 48, 48), material);
    mesh.rotation.z = (p.tiltDeg * Math.PI) / 180;
    scene.add(mesh);

    if (p.cloudPct > 4 && p.atmosphere !== 'none') {
      const cloudMap = makeCloudTexture({ coverage: p.cloudPct / 100, seed: 'pg-clouds' });
      cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.62, 48, 48), new THREE.MeshStandardMaterial({ map: cloudMap, transparent: true, opacity: 0.6, depthWrite: false }));
      scene.add(cloudMesh);
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;

    loopHandle = createLoop(canvas, () => {
      mesh.rotation.y += 0.004;
      if (cloudMesh) cloudMesh.rotation.y += 0.006;
      controls.update();
      renderer.render(scene, camera);
    });
  }

  // Created once for the page's lifetime rather than per-rebuild — the
  // callback closes over `renderer`/`camera`, so it always resizes
  // whichever scene is current without needing to be re-created.
  const resizeObserver = new ResizeObserver(() => { if (renderer && camera) fitRendererToParent(renderer, camera); });
  resizeObserver.observe(canvas.parentElement);

  function refresh() {
    const p = readParams();
    document.getElementById('pg-radius-val').textContent = `${(p.radiusPct / 100).toFixed(2)}× Earth`;
    document.getElementById('pg-density-val').textContent = `${(p.densityPct / 100).toFixed(2)}× Earth`;
    document.getElementById('pg-distance-val').textContent = `${p.distanceAu.toFixed(1)} AU`;
    document.getElementById('pg-water-val').textContent = `${p.waterPct}%`;
    document.getElementById('pg-clouds-val').textContent = `${p.cloudPct}%`;
    document.getElementById('pg-rotation-val').textContent = `${p.rotationHours} hrs`;
    document.getElementById('pg-tilt-val').textContent = `${p.tiltDeg}°`;

    const a = analyze(p);
    renderAnalysis(p, a);
    build3D(p, a);
    return { p, a };
  }

  ['pg-radius', 'pg-density', 'pg-distance', 'pg-water', 'pg-clouds', 'pg-rotation', 'pg-tilt', 'pg-atmosphere', 'pg-terrain'].forEach((id) => {
    document.getElementById(id).addEventListener('input', refresh);
  });

  document.getElementById('pg-randomize').addEventListener('click', () => {
    const rand = (min, max) => Math.round(min + Math.random() * (max - min));
    document.getElementById('pg-radius').value = rand(30, 300);
    document.getElementById('pg-density').value = rand(30, 200);
    document.getElementById('pg-distance').value = rand(3, 300);
    document.getElementById('pg-water').value = rand(0, 100);
    document.getElementById('pg-clouds').value = rand(0, 100);
    document.getElementById('pg-rotation').value = rand(6, 200);
    document.getElementById('pg-tilt').value = rand(0, 90);
    const atmos = ['none', 'thin', 'earthlike', 'thick', 'toxic'];
    const terrain = ['smooth', 'cratered', 'mountainous', 'volcanic'];
    document.getElementById('pg-atmosphere').value = atmos[rand(0, atmos.length - 1)];
    document.getElementById('pg-terrain').value = terrain[rand(0, terrain.length - 1)];
    refresh();
  });

  // Archive
  function loadArchive() {
    try { return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch (err) { return []; }
  }
  function saveArchive(list) {
    try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list)); } catch (err) { /* ignore */ }
  }
  function renderArchive() {
    const list = loadArchive();
    const grid = document.getElementById('pg-archive');
    const empty = document.getElementById('pg-archive-empty');
    empty.style.display = list.length ? 'none' : 'block';
    grid.innerHTML = list.map((w) => `
      <div class="card" style="cursor:default;">
        <span class="planet-orb" style="--orb-color:${w.color}; --orb-size:44px; margin-bottom:0.8rem;"></span>
        <h4 style="font-family:var(--font-display); font-size:0.98rem;">${w.name}</h4>
        <p class="text-muted" style="font-size:0.76rem; margin-top:0.3rem;">${w.analysis.worldType}</p>
        <div class="row gap-sm" style="margin-top:0.8rem;">
          <button type="button" class="btn btn-sm btn-outline" data-load="${w.id}">Load</button>
          <button type="button" class="btn btn-sm btn-ghost" data-delete="${w.id}">Delete</button>
        </div>
      </div>
    `).join('');
    grid.querySelectorAll('[data-load]').forEach((btn) => btn.addEventListener('click', () => loadWorld(btn.dataset.load)));
    grid.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => {
      saveArchive(loadArchive().filter((w) => w.id !== btn.dataset.delete));
      renderArchive();
    }));
  }
  function loadWorld(id) {
    const w = loadArchive().find((x) => x.id === id);
    if (!w) return;
    document.getElementById('pg-name').value = w.name;
    Object.entries(w.params).forEach(([key, val]) => {
      const map = { radiusPct: 'pg-radius', densityPct: 'pg-density', waterPct: 'pg-water', cloudPct: 'pg-clouds', rotationHours: 'pg-rotation', tiltDeg: 'pg-tilt', atmosphere: 'pg-atmosphere', terrain: 'pg-terrain' };
      if (key === 'distanceAu') { document.getElementById('pg-distance').value = Math.round(val * 10); return; }
      const el = document.getElementById(map[key]);
      if (el) el.value = val;
    });
    refresh();
  }

  document.getElementById('pg-save').addEventListener('click', () => {
    const { p, a } = refresh();
    const name = document.getElementById('pg-name').value.trim() || `World-${Date.now().toString(36)}`;
    const list = loadArchive();
    const world = { id: `${Date.now()}`, name, params: p, analysis: a, color: worldColor(p, a), createdAt: new Date().toISOString() };
    list.unshift(world);
    saveArchive(list.slice(0, 24));
    renderArchive();
    window.COSMOS?.achievements?.track('world_built');
    window.COSMOS?.blip?.(760, 0.1);
  });

  refresh();
  renderArchive();
}

function shade(hex, amt) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

init();

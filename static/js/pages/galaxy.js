/**
 * Galaxy page: procedural spiral-galaxy point cloud, a small illustrative
 * black hole / accretion disk scene, and the interactive logarithmic
 * "scale of the universe" journey.
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createRenderer, createLoop, fitRendererToParent, disposeObject3D } from '../core/scene.js';
import { makeSpriteTexture } from '../core/textures.js';

async function fetchGalaxy() {
  const res = await fetch('/api/galaxy');
  const body = await res.json();
  return body.data;
}

function renderFeatureCards(container, features, iconLetter = 'F') {
  container.innerHTML = features.map((f) => `
    <div class="stat-card reveal in-view">
      <div class="stat-value" style="font-size:1.05rem;">${f.name}</div>
      <p class="text-secondary" style="margin-top:0.5rem; font-size:0.88rem;">${f.description}</p>
    </div>
  `).join('');
}

function renderConceptBadges(container, concepts) {
  container.innerHTML = concepts.map((c) => `
    <div class="panel reveal in-view" style="padding:1rem 1.1rem;">
      <div style="font-family:var(--font-display); font-size:0.92rem;">${c.name}</div>
      <p class="text-muted" style="font-size:0.78rem; margin-top:0.3rem;">${c.description}</p>
    </div>
  `).join('');
}

function buildSpiralGalaxy(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 4000);
  camera.position.set(0, 140, 210);

  const renderer = createRenderer(canvas);
  fitRendererToParent(renderer, camera);

  const settings = window.COSMOS?.settings?.get() || {};
  const count = settings.performanceMode ? 6000 : 16000;
  const arms = 4;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const core = new THREE.Color('#fff2d0');
  const armColor = new THREE.Color('#a9b8ff');
  const rim = new THREE.Color('#5c6ad6');

  for (let i = 0; i < count; i++) {
    const radius = Math.pow(Math.random(), 1.6) * 170;
    const armIndex = i % arms;
    const armOffset = (armIndex / arms) * Math.PI * 2;
    const spin = radius * 0.045;
    const scatter = (1 - radius / 170) * 10 + 2;
    const angle = armOffset + spin + (Math.random() - 0.5) * (scatter * 0.09);
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * scatter;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * scatter;
    const y = (Math.random() - 0.5) * (8 - radius * 0.03) * (radius < 30 ? 2 : 1);
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;

    const t = radius / 170;
    const mixed = core.clone().lerp(t < 0.5 ? armColor : rim, Math.min(1, t * 1.3));
    colors[i * 3] = mixed.r; colors[i * 3 + 1] = mixed.g; colors[i * 3 + 2] = mixed.b;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 1.1, map: makeSpriteTexture('#ffffff'), transparent: true, depthWrite: false,
    vertexColors: true, opacity: 0.9, sizeAttenuation: true, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Central glow
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSpriteTexture('#fff2d0'), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.scale.set(60, 60, 1);
  scene.add(glow);

  // "You are here" marker on the Orion Arm (roughly 2/3 out, one arm)
  const markerRadius = 118;
  const markerAngle = (0 / arms) * Math.PI * 2 + markerRadius * 0.045 + 0.4;
  const markerGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0x7c8cff });
  const marker = new THREE.Mesh(markerGeo, markerMat);
  marker.position.set(Math.cos(markerAngle) * markerRadius, 2, Math.sin(markerAngle) * markerRadius);
  scene.add(marker);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3, 3.6, 32), new THREE.MeshBasicMaterial({ color: 0x7c8cff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  ring.position.copy(marker.position);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = !settings.reducedMotion;
  controls.autoRotateSpeed = 0.18;
  controls.minDistance = 60;
  controls.maxDistance = 400;

  const { stop } = createLoop(canvas, () => {
    points.rotation.y += 0.0006;
    controls.update();
    renderer.render(scene, camera);
  });

  const ro = new ResizeObserver(() => fitRendererToParent(renderer, camera));
  ro.observe(canvas.parentElement);

  return { stop: () => { stop(); ro.disconnect(); controls.dispose(); disposeObject3D(scene); renderer.dispose(); } };
}

function buildBlackHole(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(0, 5.5, 11);

  const renderer = createRenderer(canvas);
  fitRendererToParent(renderer, camera);

  const horizon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 48, 48), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  scene.add(horizon);

  // Photon sphere glow
  const photon = new THREE.Mesh(new THREE.SphereGeometry(1.9, 48, 48), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.12, side: THREE.BackSide }));
  scene.add(photon);

  // Accretion disk: a ring built from a radial gradient canvas
  const diskCanvas = document.createElement('canvas');
  diskCanvas.width = 512; diskCanvas.height = 512;
  const ctx = diskCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.15, 'rgba(255,210,130,0.9)');
  grad.addColorStop(0.45, 'rgba(255,140,60,0.55)');
  grad.addColorStop(0.8, 'rgba(140,70,180,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(256, 256, 62, 0, Math.PI * 2); ctx.fill();
  const diskTex = new THREE.CanvasTexture(diskCanvas);
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: diskTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  disk.rotation.x = Math.PI / 2.4;
  scene.add(disk);

  const settings = window.COSMOS?.settings?.get() || {};
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = !settings.reducedMotion;
  controls.autoRotateSpeed = 0.5;
  controls.minDistance = 6;
  controls.maxDistance = 22;
  controls.enablePan = false;

  const { stop } = createLoop(canvas, () => {
    disk.rotation.z += 0.0025;
    controls.update();
    renderer.render(scene, camera);
  });
  const ro = new ResizeObserver(() => fitRendererToParent(renderer, camera));
  ro.observe(canvas.parentElement);

  return { stop: () => { stop(); ro.disconnect(); controls.dispose(); disposeObject3D(scene); renderer.dispose(); } };
}

function initScaleJourney(items) {
  const track = document.getElementById('scale-track');
  const label = document.getElementById('scale-detail-label');
  const title = document.getElementById('scale-detail-title');
  const desc = document.getElementById('scale-detail-desc');
  const prevBtn = document.getElementById('scale-prev');
  const nextBtn = document.getElementById('scale-next');
  if (!track) return;

  const fill = document.createElement('div');
  fill.className = 'scale-track-fill';
  track.appendChild(fill);

  const logs = items.map((i) => Math.log10(i.size_m));
  const min = Math.min(...logs), max = Math.max(...logs);
  const pct = (v) => ((v - min) / (max - min)) * 100;

  let active = 0;
  const markers = items.map((item, i) => {
    const m = document.createElement('button');
    m.type = 'button';
    m.className = 'scale-marker';
    m.style.left = `${pct(logs[i])}%`;
    m.setAttribute('aria-label', item.label);
    m.addEventListener('click', () => select(i));
    track.appendChild(m);
    return m;
  });

  function select(i) {
    active = Math.max(0, Math.min(items.length - 1, i));
    const item = items[active];
    markers.forEach((m, idx) => m.classList.toggle('active', idx === active));
    fill.style.width = `${pct(logs[active])}%`;
    label.textContent = `Step ${active + 1} of ${items.length}`;
    title.textContent = item.label;
    desc.textContent = item.description;
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === items.length - 1;
    if (active === items.length - 1) window.COSMOS?.achievements?.track('scale_complete');
  }

  prevBtn.addEventListener('click', () => select(active - 1));
  nextBtn.addEventListener('click', () => select(active + 1));
  select(0);
}

async function init() {
  let data;
  try {
    data = await fetchGalaxy();
  } catch (err) {
    return;
  }

  renderFeatureCards(document.getElementById('galaxy-features'), data.milky_way.features);
  renderConceptBadges(document.getElementById('black-hole-concepts'), data.black_hole.concepts);
  initScaleJourney(data.scale_journey);
  window.COSMOS?.achievements?.track('visit_galaxy');

  const galaxyCanvas = document.getElementById('galaxy-canvas');
  const bhCanvas = document.getElementById('blackhole-canvas');
  if (window.COSMOS?.hasWebGL) {
    if (galaxyCanvas) buildSpiralGalaxy(galaxyCanvas);
    if (bhCanvas) buildBlackHole(bhCanvas);
  } else {
    [galaxyCanvas, bhCanvas].forEach((c) => {
      if (!c) return;
      c.parentElement.innerHTML = '<div class="webgl-fallback panel" style="width:100%;"><h3>3D View Unavailable</h3><p class="text-secondary" style="margin-top:0.6rem;">Your browser does not support WebGL.</p></div>';
    });
  }
}

init();

/**
 * Reusable multi-body "orrery" scene: the Sun plus orbiting planets. Powers
 * the homepage hero, the homepage simulator preview, and the full Solar
 * System simulator page — all from one implementation (MASTER PROMPT §39).
 *
 * Visualization modes (MASTER PROMPT §9):
 *  - visual:      evenly, pleasingly spaced orbits; planet sizes compressed
 *                 so small and large worlds are all visible at once.
 *  - size:        orbit spacing stays even, but planet radii scale with real
 *                 relative diameter — Jupiter dwarfs Mercury, as in reality.
 *  - distance:    orbit radii scale from real distance-from-Sun (compressed
 *                 with a logarithm so Neptune doesn't run off-screen);
 *                 planet sizes shrink to small, legible markers.
 *  - scientific:  same layout as distance mode, plus on-screen numeric
 *                 readouts — and this mode is the only one that claims any
 *                 numerical accuracy.
 * None of these modes render the Solar System at true simultaneous scale —
 * that is not possible on a screen — and the UI always labels which mode
 * is active (MASTER PROMPT §9, §67).
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createRenderer, createStarField, createOrbitLine, createLoop, fitRendererToParent, disposeObject3D } from './scene.js';
import { buildPlanetGroup, buildSunGroup } from './planet-builder.js';
import { makeSpriteTexture } from './textures.js';

const EARTH_DISTANCE_KM = 149600000;

function makeLabelSprite(text) {
  const canvas = document.createElement('canvas');
  const w = 256, h = 64;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 34px Space Grotesk, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(6,7,15,0.55)';
  const metrics = ctx.measureText(text);
  const pad = 18;
  const bw = metrics.width + pad * 2;
  ctx.fillRect(w / 2 - bw / 2, h / 2 - 22, bw, 44);
  ctx.fillStyle = '#eef0fb';
  ctx.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.2, 0.8, 1);
  return sprite;
}

export function createOrrery(canvas, {
  sun, planets, interactive = true, autoRotate = true, mode = 'visual',
  showOrbits = true, showLabels = true, onSelect = null, compact = false,
} = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 8000);
  camera.position.set(0, 26, 46);

  const renderer = createRenderer(canvas);
  fitRendererToParent(renderer, camera);

  scene.add(createStarField(compact ? 900 : 2400, 1200));

  const sunGroup = buildSunGroup(sun, 3.2);
  scene.add(sunGroup);
  scene.add(new THREE.AmbientLight(0x30304a, 0.35));

  const bodies = [];
  planets.forEach((planet, i) => {
    const group = new THREE.Group(); // orbit pivot
    const planetGroup = buildPlanetGroup(planet, 1);
    group.add(planetGroup);
    scene.add(group);

    const orbitLine = createOrbitLine(1, planet.color, 160, 0.28);
    scene.add(orbitLine);

    let label = null;
    if (showLabels) {
      label = makeLabelSprite(planet.name);
      group.add(label);
    }

    bodies.push({
      id: planet.id, data: planet, pivot: group, mesh: planetGroup, orbitLine, label,
      angle: Math.random() * Math.PI * 2,
      index: i,
    });
  });

  function planetRadius(p, m) {
    const rel = p.stats.diameter_km / 12742; // Earth = 1
    if (m === 'size') return THREE.MathUtils.clamp(rel * 0.62, 0.35, 6.2);
    if (m === 'visual') return 0.55 + Math.pow(rel, 0.42) * 0.85;
    return 0.42 + Math.pow(rel, 0.3) * 0.45; // distance / scientific: small, legible
  }
  function orbitRadius(p, m, i) {
    if (m === 'distance' || m === 'scientific') {
      return 6.5 + Math.log10(p.stats.distance_km / EARTH_DISTANCE_KM + 1.4) * 11;
    }
    return 6.5 + i * 3.65; // visual / size: evenly spaced for legibility
  }

  function applyMode(nextMode) {
    mode = nextMode;
    bodies.forEach((b) => {
      const r = orbitRadius(b.data, mode, b.index);
      const pr = planetRadius(b.data, mode);
      b.orbitRadius = r;
      b.mesh.scale.setScalar(pr);
      b.orbitLine.geometry.dispose();
      const seg = 160;
      const pts = [];
      for (let s = 0; s <= seg; s++) {
        const t = (s / seg) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
      }
      b.orbitLine.geometry.setFromPoints(pts);
      if (b.label) b.label.position.set(0, pr + 0.9, 0);
    });
  }
  applyMode(mode);

  function setOrbitsVisible(v) { bodies.forEach((b) => { b.orbitLine.visible = v; }); }
  function setLabelsVisible(v) { bodies.forEach((b) => { if (b.label) b.label.visible = v; }); }
  setOrbitsVisible(showOrbits);
  setLabelsVisible(showLabels);

  let controls = null;
  if (interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 8;
    controls.maxDistance = 220;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.28;
  }

  // Raycasting for hover/click selection
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function pickAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = bodies.map((b) => b.mesh);
    const hits = raycaster.intersectObjects(meshes, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !bodies.find((b) => b.mesh === obj)) obj = obj.parent;
    return bodies.find((b) => b.mesh === obj) || null;
  }

  function onMove(e) {
    const hit = pickAt(e.clientX, e.clientY);
    hovered = hit;
    canvas.style.cursor = hit ? 'pointer' : '';
  }
  function onClick(e) {
    const hit = pickAt(e.clientX, e.clientY);
    if (hit && onSelect) onSelect(hit.id, hit.data);
  }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);

  let playing = true;
  let speed = 1;

  const clock = new THREE.Clock();
  const { stop, start } = createLoop(canvas, () => {
    const dt = clock.getDelta();
    sunGroup.rotation.y += dt * 0.03;
    if (playing) {
      bodies.forEach((b) => {
        const periodDays = Math.max(Math.abs(b.data.stats.orbital_period_days), 1);
        const angularSpeed = (1 / periodDays) * speed * 6; // tuned for a pleasing default pace
        b.angle += dt * angularSpeed;
        b.pivot.position.set(Math.cos(b.angle) * b.orbitRadius, 0, Math.sin(b.angle) * b.orbitRadius);
        b.mesh.rotation.y += dt * 0.6;
      });
    }
    controls?.update();
    renderer.render(scene, camera);
  });

  function onResize() { fitRendererToParent(renderer, camera); }
  const ro = new ResizeObserver(onResize);
  ro.observe(canvas.parentElement);

  return {
    setPlaying(v) { playing = v; },
    isPlaying: () => playing,
    setSpeed(v) { speed = v; },
    setMode: applyMode,
    setOrbitsVisible,
    setLabelsVisible,
    getHovered: () => hovered,
    focusOn(id) {
      const b = bodies.find((x) => x.id === id);
      if (!b || !controls) return;
      const target = new THREE.Vector3();
      b.pivot.getWorldPosition(target);
      controls.target.copy(target);
    },
    dispose() {
      stop();
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('click', onClick);
      controls?.dispose();
      disposeObject3D(scene);
      renderer.dispose();
    },
  };
}

/**
 * Reusable Three.js scene scaffolding: renderer creation (with device pixel
 * ratio caps and performance-mode awareness), a background star field
 * built from real 3D points (distinct from the 2D CSS starfield behind the
 * page), resize handling, and resource disposal helpers so every page's
 * 3D view can be built from the same small toolkit instead of duplicating
 * setup code (MASTER PROMPT §39).
 */
import * as THREE from 'three';
import { makeSpriteTexture } from './textures.js';

export function createRenderer(canvas, { alpha = true } = {}) {
  const settings = window.COSMOS?.settings?.get() || {};
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !settings.performanceMode,
    alpha,
    powerPreference: 'high-performance',
  });
  const cap = settings.performanceMode ? 1.25 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function createStarField(count = 2200, spread = 900) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = spread * (0.35 + Math.random() * 0.65);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = Math.random() * 2.4 + 0.4;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 1.6,
    map: makeSpriteTexture('#ffffff'),
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createOrbitLine(radius, color = '#4a5170', segments = 128, opacity = 0.35) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geometry, material);
}

/** Disposes geometries, materials, and textures of an Object3D subtree. */
export function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((m) => {
        Object.keys(m).forEach((key) => {
          const val = m[key];
          if (val && val.isTexture) val.dispose();
        });
        m.dispose();
      });
    }
  });
}

/**
 * Runs a render loop via requestAnimationFrame that automatically pauses
 * when the tab is hidden or the element scrolls off-screen, and respects
 * prefers-reduced-motion by rendering a single still frame instead of a
 * continuous loop.
 */
export function createLoop(canvas, tick) {
  let rafId = null;
  let visible = true;
  const reduced = window.COSMOS?.settings?.get()?.reducedMotion;

  function frame(t) {
    tick(t);
    if (visible && !reduced) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId) return;
    if (reduced) { tick(0); return; }
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      visible = entry.isIntersecting;
      if (visible) start(); else stop();
    });
  }, { threshold: 0.01 });
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (visible) start();
  });

  start();
  return { stop, start };
}

export function fitRendererToParent(renderer, camera) {
  const parent = renderer.domElement.parentElement;
  if (!parent) return;
  const w = parent.clientWidth, h = parent.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(h, 1);
  camera.updateProjectionMatrix();
}

/**
 * A single reusable "rotate & zoom" 3D viewer for one celestial body — used
 * by the Sun page, every planet detail page, moon pages, and dwarf planet
 * pages, so each only needs a <canvas> and a data object rather than its
 * own Three.js setup (MASTER PROMPT §39, §11–§20 "rotate / zoom / facts").
 */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createRenderer, createStarField, createLoop, fitRendererToParent, disposeObject3D } from './scene.js';
import { buildPlanetGroup, buildSunGroup, buildMoonMesh } from './planet-builder.js';

export function createBodyViewer(canvas, { kind = 'planet', data, radius = 2.4 } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
  camera.position.set(0, radius * 0.7, radius * 4.2);

  const renderer = createRenderer(canvas);
  fitRendererToParent(renderer, camera);

  scene.add(createStarField(1200, 400));

  let body;
  if (kind === 'sun') {
    body = buildSunGroup(data, radius);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  } else if (kind === 'moon' || kind === 'dwarf') {
    const mesh = buildMoonMesh(data, radius);
    body = new THREE.Group();
    body.add(mesh);
    scene.add(new THREE.AmbientLight(0x40405a, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 4, 8);
    scene.add(key);
  } else {
    body = buildPlanetGroup(data, radius);
    scene.add(new THREE.AmbientLight(0x40405a, 0.55));
    const key = new THREE.DirectionalLight(0xfff2d8, 1.9);
    key.position.set(8, 3, 6);
    scene.add(key);
  }
  scene.add(body);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = radius * 1.6;
  controls.maxDistance = radius * 9;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enablePan = false;

  const spin = kind === 'sun' ? 0.05 : 0.12;

  const { stop, start } = createLoop(canvas, () => {
    body.rotation.y += spin * 0.016;
    controls.update();
    renderer.render(scene, camera);
  });

  function onResize() {
    fitRendererToParent(renderer, camera);
  }
  const ro = new ResizeObserver(onResize);
  ro.observe(canvas.parentElement);

  return {
    setAutoRotate(v) { controls.autoRotate = v; },
    dispose() {
      stop();
      ro.disconnect();
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
    },
  };
}

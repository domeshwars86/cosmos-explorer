/**
 * Builds reusable Three.js Object3D groups for the Sun, planets, and moons
 * from plain data objects (see app/data/*.json, passed to the page via the
 * JSON API or inline `<script type="application/json">` blocks). Centralizing
 * mesh construction here means every page — hero, solar system simulator,
 * planet detail — shares one implementation instead of duplicating it
 * (MASTER PROMPT §39).
 */
import * as THREE from 'three';
import {
  makeCrateredTexture, makeBandedTexture, makeEarthTexture, makeCloudTexture,
  makeMarsTexture, makeSunTexture, makeRingTexture, makeSpriteTexture,
} from './textures.js';

const TEXTURE_STYLE = {
  mercury: 'cratered',
  venus: 'clouded',
  earth: 'earth',
  mars: 'mars',
  jupiter: 'banded',
  saturn: 'banded',
  uranus: 'banded',
  neptune: 'banded',
};

const RING_PLANETS = {
  saturn: { color: '#D8C79E', innerMul: 1.3, outerMul: 2.3, opacity: 1 },
  uranus: { color: '#8fd0d4', innerMul: 1.5, outerMul: 1.9, opacity: 0.55 },
  neptune: { color: '#7C97FF', innerMul: 1.5, outerMul: 1.8, opacity: 0.35 },
};

const textureCache = new Map();
function cached(key, fn) {
  if (textureCache.has(key)) return textureCache.get(key);
  const tex = fn();
  textureCache.set(key, tex);
  return tex;
}

export function buildPlanetGroup(planet, radius = 1) {
  const group = new THREE.Group();
  group.name = `planet-${planet.id}`;
  const style = TEXTURE_STYLE[planet.id] || 'cratered';
  const tex = planet.texture || {};

  let material;
  if (style === 'earth') {
    const map = cached('earth-surface', () => makeEarthTexture({ size: 1024 }));
    material = new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0.05 });
  } else if (style === 'banded') {
    const map = cached(`banded-${planet.id}`, () => makeBandedTexture({
      base: tex.base, detail: tex.detail, highlight: tex.highlight,
      seed: planet.id, bigSpot: planet.id === 'jupiter', spotColor: '#c1440e',
    }));
    material = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
  } else if (style === 'mars') {
    const map = cached('mars-surface', () => makeMarsTexture({ base: tex.base, detail: tex.detail, highlight: tex.highlight }));
    material = new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0.05 });
  } else if (style === 'clouded') {
    const map = cached('venus-surface', () => makeBandedTexture({ base: tex.base, detail: tex.detail, highlight: tex.highlight, seed: 'venus', bigSpot: false }));
    material = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
  } else {
    const map = cached(`cratered-${planet.id}`, () => makeCrateredTexture({ base: tex.base, detail: tex.detail, highlight: tex.highlight, seed: planet.id }));
    material = new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0.05 });
  }

  const geometry = new THREE.SphereGeometry(radius, 48, 48);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'surface';
  const axialTilt = ((planet.axial_tilt_deg || 0) * Math.PI) / 180;
  mesh.rotation.z = axialTilt;
  group.add(mesh);

  // Earth cloud + atmosphere glow
  if (planet.id === 'earth') {
    const cloudMap = cached('earth-clouds', () => makeCloudTexture({ coverage: 0.42, color: '255,255,255', seed: 'earth-clouds' }));
    const cloudMat = new THREE.MeshStandardMaterial({ map: cloudMap, transparent: true, opacity: 0.55, depthWrite: false });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 48, 48), cloudMat);
    clouds.name = 'clouds';
    clouds.rotation.z = axialTilt;
    group.add(clouds);
  }

  // Venus haze layer
  if (planet.id === 'venus') {
    const hazeMap = cached('venus-clouds', () => makeCloudTexture({ coverage: 0.9, color: '245,225,180', seed: 'venus-clouds' }));
    const hazeMat = new THREE.MeshStandardMaterial({ map: hazeMap, transparent: true, opacity: 0.5, depthWrite: false });
    const haze = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.015, 48, 48), hazeMat);
    group.add(haze);
  }

  // Thin atmosphere glow shell for terrestrial-with-air worlds
  if (['earth', 'venus', 'mars'].includes(planet.id)) {
    const glowColor = new THREE.Color(planet.color || '#7c8cff');
    const glowMat = new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.12, side: THREE.BackSide });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 32, 32), glowMat);
    group.add(glow);
  }

  const ringCfg = RING_PLANETS[planet.id];
  if (ringCfg) {
    const ringTex = cached(`ring-${planet.id}`, () => makeRingTexture({ color: ringCfg.color }));
    const ringGeo = new THREE.RingGeometry(radius * ringCfg.innerMul, radius * ringCfg.outerMul, 128);
    // Map UVs radially so the 1D ring texture reads outward, not around.
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const dist = v3.length();
      const t = (dist - radius * ringCfg.innerMul) / (radius * (ringCfg.outerMul - ringCfg.innerMul));
      uv.setXY(i, t, 0.5);
    }
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex, transparent: true, opacity: ringCfg.opacity, side: THREE.DoubleSide, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'rings';
    ring.rotation.x = Math.PI / 2 - (axialTilt || 0.05);
    group.add(ring);
  }

  group.userData.spinSpeed = 0.15 / Math.max(planet.stats?.rotation_period_hours ? Math.abs(planet.stats.rotation_period_hours) / 24 : 1, 0.15);
  return group;
}

export function buildMoonMesh(moon, radius = 0.25) {
  const map = cached(`moon-${moon.id}`, () => makeCrateredTexture({
    base: moon.color || '#c9c9c9', detail: shade(moon.color, -0.35), highlight: shade(moon.color, 0.3), seed: moon.id,
  }));
  const material = new THREE.MeshStandardMaterial({ map, roughness: 0.95 });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
  mesh.name = `moon-${moon.id}`;
  return mesh;
}

export function buildSunGroup(sun, radius = 4) {
  const group = new THREE.Group();
  const tex = sun.texture || {};
  const map = cached('sun-surface', () => makeSunTexture({ base: tex.base, spot: tex.spot, glow: tex.glow }));
  const material = new THREE.MeshBasicMaterial({ map, color: 0xffffff });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), material);
  mesh.name = 'sun-surface';
  group.add(mesh);

  // Soft glow halo via an additive sprite, cheaper than post-processing bloom.
  const spriteMap = cached('sun-glow-sprite', () => makeSpriteTexture(tex.glow || '#FFE9B0'));
  const spriteMat = new THREE.SpriteMaterial({ map: spriteMap, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(radius * 4.4, radius * 4.4, 1);
  group.add(sprite);

  const light = new THREE.PointLight(0xfff2d0, 3.2, 0, 0);
  light.name = 'sun-light';
  group.add(light);

  return group;
}

function shade(hex, amt) {
  if (!hex) return '#888888';
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
  r = f(r); g = f(g); b = f(b);
  return `rgb(${r},${g},${b})`;
}

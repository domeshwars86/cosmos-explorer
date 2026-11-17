/**
 * Procedural canvas-based textures for planets, moons, the Sun, rings, and
 * particle sprites. Using generated textures (rather than downloaded image
 * files) keeps the project fully self-contained, avoids texture licensing
 * concerns, and means a missing asset can never break the 3D scene — see
 * MASTER PROMPT §40 ("graceful fallback materials"). Every function here
 * returns a real THREE.CanvasTexture built from an offscreen <canvas>.
 */
import * as THREE from 'three';

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStringToSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size / 2 >= 1 ? size : size; // square by default; overridden per-use
  return canvas;
}

function finalize(canvas, repeatX = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Cratered rocky texture (Mercury, the Moon, small icy moons). */
export function makeCrateredTexture({ base = '#8c8a86', detail = '#5c5a56', highlight = '#c9c6bf', seed = 'mercury', size = 1024 } = {}) {
  const rand = seededRandom(hashStringToSeed(seed));
  const w = size, h = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Subtle base mottling
  for (let i = 0; i < 900; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * 10 + 2;
    ctx.globalAlpha = 0.05 + rand() * 0.08;
    ctx.fillStyle = rand() > 0.5 ? highlight : detail;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Craters: dark rim + darker floor + tiny highlight
  const craterCount = Math.round(w * 0.09);
  for (let i = 0; i < craterCount; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * rand() * (w * 0.035) + 2;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, detail);
    grad.addColorStop(0.7, detail);
    grad.addColorStop(0.85, highlight);
    grad.addColorStop(1, base);
    ctx.globalAlpha = 0.35 + rand() * 0.3;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return finalize(canvas);
}

/** Banded gas giant texture (Jupiter, Saturn, Uranus, Neptune). */
export function makeBandedTexture({ base = '#d8bd93', detail = '#a97a4a', highlight = '#f0e0bd', seed = 'jupiter', size = 1024, bigSpot = false, spotColor = '#c1440e' } = {}) {
  const rand = seededRandom(hashStringToSeed(seed));
  const w = size, h = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const bandCount = 14 + Math.floor(rand() * 6);
  const bandH = h / bandCount;
  const palette = [base, detail, highlight];
  for (let b = 0; b < bandCount; b++) {
    const y0 = b * bandH;
    const color = palette[Math.floor(rand() * palette.length)];
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    ctx.fillStyle = color;
    ctx.fillRect(0, y0, w, bandH * (0.6 + rand() * 0.7));
  }
  ctx.globalAlpha = 1;

  // Turbulent horizontal streaks for texture within bands
  for (let i = 0; i < 260; i++) {
    const y = rand() * h;
    const x = rand() * w;
    const len = 40 + rand() * 160;
    ctx.strokeStyle = rand() > 0.5 ? highlight : detail;
    ctx.globalAlpha = 0.08 + rand() * 0.12;
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.3, y + (rand() - 0.5) * 14, x + len * 0.7, y + (rand() - 0.5) * 14, x + len, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (bigSpot) {
    const sx = w * (0.32 + rand() * 0.1);
    const sy = h * (0.55 + rand() * 0.08);
    const rw = w * 0.09, rh = h * 0.13;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(rw, rh));
    grad.addColorStop(0, spotColor);
    grad.addColorStop(0.7, spotColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  return finalize(canvas);
}

/** Earth: oceans, landmasses, ice caps. Clouds are a separate transparent layer. */
export function makeEarthTexture({ size = 1024 } = {}) {
  const rand = seededRandom(42);
  const w = size, h = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const ocean = ctx.createLinearGradient(0, 0, 0, h);
  ocean.addColorStop(0, '#0e2f66');
  ocean.addColorStop(0.5, '#1c58a8');
  ocean.addColorStop(1, '#0e2f66');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, w, h);

  // Landmasses as soft irregular blobs
  const continents = 9;
  for (let c = 0; c < continents; c++) {
    const cx = rand() * w, cy = h * 0.15 + rand() * h * 0.7;
    const blobs = 10 + Math.floor(rand() * 10);
    ctx.fillStyle = rand() > 0.4 ? '#3f8f4f' : '#5a9a4a';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (let i = 0; i < blobs; i++) {
      const angle = (i / blobs) * Math.PI * 2;
      const rad = (w * 0.03 + rand() * w * 0.05);
      const x = cx + Math.cos(angle) * rad * (1 + rand() * 0.6);
      const y = cy + Math.sin(angle) * rad * (0.6 + rand() * 0.6);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Polar ice caps
  const iceTop = ctx.createLinearGradient(0, 0, 0, h * 0.14);
  iceTop.addColorStop(0, 'rgba(240,248,255,0.95)');
  iceTop.addColorStop(1, 'rgba(240,248,255,0)');
  ctx.fillStyle = iceTop;
  ctx.fillRect(0, 0, w, h * 0.14);
  const iceBottom = ctx.createLinearGradient(0, h * 0.86, 0, h);
  iceBottom.addColorStop(0, 'rgba(240,248,255,0)');
  iceBottom.addColorStop(1, 'rgba(240,248,255,0.95)');
  ctx.fillStyle = iceBottom;
  ctx.fillRect(0, h * 0.86, w, h * 0.14);

  return finalize(canvas);
}

/** Transparent cloud layer for Earth (and hazy Venus/Titan atmospheres). */
export function makeCloudTexture({ size = 1024, coverage = 0.42, color = '255,255,255', seed = 'clouds' } = {}) {
  const rand = seededRandom(hashStringToSeed(seed));
  const w = size, h = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const puffs = Math.round(w * h * 0.0009 * coverage * 4);
  for (let i = 0; i < puffs; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * rand() * 26 + 3;
    ctx.globalAlpha = 0.08 + rand() * 0.22;
    ctx.fillStyle = `rgba(${color},1)`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return finalize(canvas);
}

/** Mars: rusty terrain with darker basins and polar caps. */
export function makeMarsTexture({ base = '#b3502c', detail = '#7a3216', highlight = '#d99b74', size = 1024 } = {}) {
  const tex = makeCrateredTexture({ base, detail, highlight, seed: 'mars', size });
  return tex;
}

/** Turbulent glowing Sun surface. */
export function makeSunTexture({ base = '#FFB13B', spot = '#FF7A1A', glow = '#FFE9B0', size = 1024 } = {}) {
  const rand = seededRandom(7);
  const w = size, h = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 2200; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * 8 + 1;
    ctx.globalAlpha = 0.06 + rand() * 0.12;
    ctx.fillStyle = rand() > 0.5 ? glow : spot;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // Sunspots
  for (let i = 0; i < 14; i++) {
    const x = rand() * w, y = rand() * h, r = rand() * 14 + 6;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = spot;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return finalize(canvas);
}

/** Radial ring texture with concentric bands and gaps (Saturn, Uranus). */
export function makeRingTexture({ color = '#D8C79E', size = 512 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const rand = seededRandom(99);
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const alpha = 0.15 + rand() * 0.55;
    grad.addColorStop(t, `rgba(${hexToRgb(color)}, ${alpha.toFixed(2)})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `${r},${g},${b}`;
}

/** Soft circular sprite for particle points (stars, dust). */
export function makeSpriteTexture(color = '#ffffff') {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

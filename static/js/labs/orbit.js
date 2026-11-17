/**
 * Orbit Lab — a small real (if simplified) two-body gravity simulation
 * running on a 2D canvas. A tangential launch velocity at a given distance
 * from a central mass is numerically integrated frame by frame, and
 * classified against the analytic circular/escape velocities for that
 * distance (v_escape = v_circular × √2 is real orbital mechanics, just
 * applied to an arbitrary/unscaled central mass for visual clarity).
 */

const GM = 2_156_000; // arbitrary central-mass constant, tuned so slider ranges feel right
const DT = 0.01;
const SUBSTEPS = 4;
const MIN_R = 14;

export function initOrbitLab() {
  const canvas = document.getElementById('orbit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const distanceSlider = document.getElementById('orbit-distance');
  const velocitySlider = document.getElementById('orbit-velocity');
  const distanceVal = document.getElementById('orbit-distance-val');
  const velocityVal = document.getElementById('orbit-velocity-val');
  const classificationEl = document.getElementById('orbit-classification');
  const resetBtn = document.getElementById('orbit-reset');
  const panel = document.querySelector('[data-tab-panel="orbit"]');

  let state = null;
  let trail = [];
  let collided = false;

  function circularVelocity(r) { return Math.sqrt(GM / r); }

  function classify(r, v) {
    const vc = circularVelocity(r);
    const ve = vc * Math.SQRT2;
    if (v < vc * 0.15) return 'Collision Trajectory';
    if (v >= ve) return 'Escape Trajectory';
    if (v >= vc * 0.85 && v <= vc * 1.15) return 'Stable, Near-Circular Orbit';
    return 'Elliptical Orbit';
  }

  function reset() {
    const r = parseFloat(distanceSlider.value);
    const v = parseFloat(velocitySlider.value);
    state = { x: r, y: 0, vx: 0, vy: v };
    trail = [];
    collided = false;
    updateReadouts(r, v);
  }

  function updateReadouts(r, v) {
    distanceVal.textContent = `${r.toFixed(0)} px`;
    velocityVal.textContent = `${v.toFixed(0)} u/s`;
    classificationEl.textContent = classify(r, v);
  }

  function step() {
    if (collided) return;
    for (let i = 0; i < SUBSTEPS; i++) {
      const r = Math.hypot(state.x, state.y);
      if (r < MIN_R) { collided = true; classificationEl.textContent = 'Collision Trajectory — object reached the central body'; break; }
      const a = -GM / (r * r * r);
      state.vx += a * state.x * DT;
      state.vy += a * state.y * DT;
      state.x += state.vx * DT;
      state.y += state.vy * DT;
    }
    trail.push({ x: state.x, y: state.y });
    if (trail.length > 400) trail.shift();
  }

  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;

    // Central body
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
    grad.addColorStop(0, '#fff2d0');
    grad.addColorStop(1, '#ffb13b');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();

    // Trail
    ctx.strokeStyle = 'rgba(124,140,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const x = cx + p.x, y = cy + p.y;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Satellite
    if (!collided && state) {
      ctx.fillStyle = '#7c8cff';
      ctx.beginPath();
      ctx.arc(cx + state.x, cy + state.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (panel && panel.classList.contains('active') && !window.COSMOS?.settings?.get()?.reducedMotion) {
      step();
      draw();
    }
    requestAnimationFrame(loop);
  }

  distanceSlider.addEventListener('input', reset);
  velocitySlider.addEventListener('input', reset);
  resetBtn.addEventListener('click', reset);

  reset();
  draw();
  requestAnimationFrame(loop);
}

/**
 * Seasons Lab — the key idea this lab demonstrates: Earth's rotational
 * axis stays pointed in a fixed direction in space (here, a constant
 * -23.4° screen tilt) as Earth orbits the Sun. Seasons happen because
 * that fixed tilt means each hemisphere alternately leans toward or away
 * from the Sun over the year — not because Earth's distance from the Sun
 * changes (it barely does).
 */
const TILT_DEG = -23.4;
const TILT_RAD = (TILT_DEG * Math.PI) / 180;
const AXIS = { x: Math.sin(TILT_RAD), y: -Math.cos(TILT_RAD) };

// Bucket centers derived from the fixed tilt direction (see initSeasonsLab
// docstring): N-summer solstice at theta≈66.6°, N-autumn equinox≈156.6°,
// N-winter solstice≈246.6°, N-spring equinox≈336.6° — each season bucket
// spans the 90° centered on its solstice/equinox.
function northSeason(theta) {
  const t = ((theta % 360) + 360) % 360;
  if (t >= 21.6 && t < 111.6) return 'Summer';
  if (t >= 111.6 && t < 201.6) return 'Autumn';
  if (t >= 201.6 && t < 291.6) return 'Winter';
  return 'Spring';
}
const OPPOSITE = { Summer: 'Winter', Winter: 'Summer', Spring: 'Autumn', Autumn: 'Spring' };

export function initSeasonsLab() {
  const canvas = document.getElementById('seasons-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const angleSlider = document.getElementById('seasons-angle');
  const angleVal = document.getElementById('seasons-angle-val');
  const northEl = document.getElementById('seasons-north');
  const southEl = document.getElementById('seasons-south');

  const sun = { x: 240, y: 240, r: 22 };
  const orbitR = 170;

  function draw(theta) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.arc(sun.x, sun.y, orbitR, 0, Math.PI * 2); ctx.stroke();

    const sg = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.r);
    sg.addColorStop(0, '#fff2d0'); sg.addColorStop(1, '#ffb13b');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); ctx.fill();

    const rad = (theta * Math.PI) / 180;
    const ex = sun.x + orbitR * Math.cos(rad);
    const ey = sun.y + orbitR * Math.sin(rad);

    ctx.fillStyle = '#3d8bff';
    ctx.beginPath(); ctx.arc(ex, ey, 15, 0, Math.PI * 2); ctx.fill();

    // Fixed-direction axis line (does NOT rotate with orbital position)
    ctx.strokeStyle = '#ffe9b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - AXIS.x * 24, ey - AXIS.y * 24);
    ctx.lineTo(ex + AXIS.x * 24, ey + AXIS.y * 24);
    ctx.stroke();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '11px monospace';
    ctx.fillText('N', ex + AXIS.x * 24 - 4, ey + AXIS.y * 24 - 6);
    ctx.fillText('S', ex - AXIS.x * 24 - 4, ey - AXIS.y * 24 + 14);
  }

  function update() {
    const theta = parseFloat(angleSlider.value);
    angleVal.textContent = `${theta.toFixed(0)}°`;
    const n = northSeason(theta);
    northEl.textContent = n;
    southEl.textContent = OPPOSITE[n];
    draw(theta);
  }

  angleSlider.addEventListener('input', update);
  update();
}

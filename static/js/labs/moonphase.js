/**
 * Moon Phase Lab — the Moon's phase depends only on the Sun-Earth-Moon
 * angle, not on Earth's shadow (a common misconception). Dragging the
 * slider moves the Moon through its orbit; the illuminated fraction and
 * which side is lit are both derived directly from that angle.
 */
const PHASE_NAMES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Third Quarter', 'Waning Crescent'];

export function initMoonPhaseLab() {
  const canvas = document.getElementById('moonphase-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const angleSlider = document.getElementById('moonphase-angle');
  const angleVal = document.getElementById('moonphase-angle-val');
  const nameEl = document.getElementById('moonphase-name');

  const earth = { x: 240, y: 160, r: 18 };
  const sun = { x: 20, y: 160, r: 24 };
  const orbitR = 90;

  function phaseName(theta) {
    const idx = Math.round(theta / 45) % 8;
    return PHASE_NAMES[idx];
  }

  function drawMoonDisk(mx, my, r, theta) {
    const f = (1 - Math.cos((theta * Math.PI) / 180)) / 2; // illuminated fraction, 0..1
    const dx = r * 2 * (1 - f);
    const waxing = theta <= 180;
    const darkCx = waxing ? mx - dx : mx + dx;

    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#e9ecf7';
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1c2e';
    ctx.beginPath(); ctx.arc(darkCx, my, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.stroke();
  }

  function draw(theta) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, w, h);

    const sg = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.r);
    sg.addColorStop(0, '#fff2d0'); sg.addColorStop(1, '#ffb13b');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#3d8bff';
    ctx.beginPath(); ctx.arc(earth.x, earth.y, earth.r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.ellipse(earth.x, earth.y, orbitR, orbitR, 0, 0, Math.PI * 2); ctx.stroke();

    const phi = ((180 - theta) * Math.PI) / 180;
    const mx = earth.x + orbitR * Math.cos(phi);
    const my = earth.y + orbitR * Math.sin(phi);
    drawMoonDisk(mx, my, 16, theta);
  }

  function update() {
    const theta = parseFloat(angleSlider.value);
    angleVal.textContent = `${theta.toFixed(0)}°`;
    nameEl.textContent = phaseName(theta);
    draw(theta);
  }

  angleSlider.addEventListener('input', update);
  update();
}

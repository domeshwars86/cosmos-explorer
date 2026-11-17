/**
 * Eclipse Lab — a 2D Sun/Earth/Moon alignment diagram. The Moon's real
 * orbit is tilted about 5° relative to Earth's orbit around the Sun, which
 * is exactly why eclipses don't happen every month even though the Moon
 * passes "between" and "behind" Earth once per orbit. The realistic-tilt
 * toggle narrows the alignment tolerance to represent that rarity; turning
 * it off widens the tolerance into an easier teaching mode for the core
 * geometry.
 */
export function initEclipseLab() {
  const canvas = document.getElementById('eclipse-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const angleSlider = document.getElementById('eclipse-angle');
  const angleVal = document.getElementById('eclipse-angle-val');
  const tiltToggle = document.getElementById('eclipse-tilt');
  const resultEl = document.getElementById('eclipse-result');
  const explainEl = document.getElementById('eclipse-explain');

  const earth = { x: 240, y: 160, r: 18 };
  const sun = { x: 20, y: 160, r: 26 };
  const orbitR = 90;

  function computeMoon(theta) {
    const phi = ((180 - theta) * Math.PI) / 180;
    return { x: earth.x + orbitR * Math.cos(phi), y: earth.y + orbitR * Math.sin(phi), r: 8 };
  }

  function classify(theta, tiltOn) {
    const distTo0 = Math.min(theta, 360 - theta);
    const distTo180 = Math.abs(theta - 180);
    const tolerance = tiltOn ? 6 : 18;
    if (distTo0 <= tolerance) return 'solar';
    if (distTo180 <= tolerance) return 'lunar';
    return 'none';
  }

  function draw(theta) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const moon = computeMoon(theta);
    const kind = classify(theta, tiltToggle.checked);

    // Sun rays background
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, w, h);

    // Shadow cones
    if (kind === 'solar') {
      ctx.fillStyle = 'rgba(10,10,20,0.85)';
      ctx.beginPath();
      ctx.moveTo(moon.x, moon.y - moon.r);
      ctx.lineTo(earth.x + 40, earth.y - earth.r * 0.4);
      ctx.lineTo(earth.x + 40, earth.y + earth.r * 0.4);
      ctx.lineTo(moon.x, moon.y + moon.r);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'lunar') {
      ctx.fillStyle = 'rgba(60,20,40,0.55)';
      ctx.beginPath();
      ctx.moveTo(earth.x, earth.y - earth.r);
      ctx.lineTo(moon.x + 30, moon.y - moon.r * 1.6);
      ctx.lineTo(moon.x + 30, moon.y + moon.r * 1.6);
      ctx.lineTo(earth.x, earth.y + earth.r);
      ctx.closePath();
      ctx.fill();
    }

    // Sun
    const sg = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.r);
    sg.addColorStop(0, '#fff2d0'); sg.addColorStop(1, '#ffb13b');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2); ctx.fill();

    // Earth
    ctx.fillStyle = '#3d8bff';
    ctx.beginPath(); ctx.arc(earth.x, earth.y, earth.r, 0, Math.PI * 2); ctx.fill();

    // Orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.ellipse(earth.x, earth.y, orbitR, orbitR, 0, 0, Math.PI * 2); ctx.stroke();

    // Moon
    ctx.fillStyle = '#c9c9c9';
    ctx.beginPath(); ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2); ctx.fill();

    updateResult(kind);
  }

  function updateResult(kind) {
    if (kind === 'solar') {
      resultEl.textContent = 'Solar Eclipse Possible';
      explainEl.innerHTML = 'The Moon sits between the Sun and Earth. In the dark <strong>umbra</strong> region, the Sun is fully blocked (total eclipse); in the lighter <strong>penumbra</strong> around it, the Sun is only partially blocked.';
    } else if (kind === 'lunar') {
      resultEl.textContent = 'Lunar Eclipse Possible';
      explainEl.innerHTML = "Earth sits between the Sun and Moon, casting its shadow onto the Moon's surface — the Moon can darken or turn reddish as it passes through Earth's shadow.";
    } else {
      resultEl.textContent = 'No Eclipse';
      explainEl.textContent = tiltToggle.checked
        ? "The Moon's orbit is tilted about 5° relative to Earth's path around the Sun, so its shadow (or Earth's shadow) usually misses — this is why eclipses are relatively rare events, not a monthly occurrence."
        : 'The Moon is not currently aligned with the Sun-Earth line.';
    }
  }

  function update() {
    const theta = parseFloat(angleSlider.value);
    angleVal.textContent = `${theta.toFixed(0)}°`;
    draw(theta);
  }

  angleSlider.addEventListener('input', update);
  tiltToggle.addEventListener('change', update);
  update();
}

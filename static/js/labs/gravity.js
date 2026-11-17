/**
 * Gravity Lab — reuses the real per-body gravity values from the API (the
 * same numbers used everywhere else on the site) to show equivalent
 * weight and an estimated jump height (h = v² / 2g) across the Solar
 * System, the Moon, and the Sun.
 */
export async function initGravityLab() {
  const runBtn = document.getElementById('gravity-run');
  if (!runBtn) return;

  let bodies = null;
  async function loadBodies() {
    if (bodies) return bodies;
    const [planetsRes, moonRes, sunRes] = await Promise.all([
      fetch('/api/planets').then((r) => r.json()),
      fetch('/api/moon/moon').then((r) => r.json()),
      fetch('/api/sun').then((r) => r.json()),
    ]);
    bodies = [
      ...planetsRes.data.map((p) => ({ id: p.id, name: p.name, gravity: p.stats.gravity_ms2, color: p.color })),
    ];
    bodies.splice(3, 0, { id: 'moon', name: 'The Moon', gravity: moonRes.data.gravity_ms2, color: '#C9C9C9' });
    bodies.push({ id: 'sun', name: 'The Sun', gravity: sunRes.data.stats.gravity_ms2, color: sunRes.data.color });
    return bodies;
  }

  function run() {
    loadBodies().then((list) => {
      const weight = parseFloat(document.getElementById('gravity-weight').value) || 70;
      const velocity = parseFloat(document.getElementById('gravity-velocity').value) || 2.5;
      const earthG = list.find((b) => b.id === 'earth').gravity;
      const results = document.getElementById('gravity-results');
      results.innerHTML = list.map((b) => {
        const equivWeight = (weight * (b.gravity / earthG)).toFixed(1);
        const jumpHeight = (velocity * velocity) / (2 * b.gravity);
        const heightStr = jumpHeight >= 10 ? `${jumpHeight.toFixed(0)} m` : `${(jumpHeight * 100).toFixed(0)} cm`;
        return `
          <div class="calc-result-card" style="--dot-color:${b.color};">
            <div class="body-name"><span class="dot"></span>${b.name}</div>
            <div class="body-value">${equivWeight} kg</div>
            <div class="text-muted" style="font-size:0.76rem; margin-top:0.3rem;">Jump height ≈ ${heightStr}</div>
          </div>`;
      }).join('');
    });
  }

  runBtn.addEventListener('click', run);
  run();
}

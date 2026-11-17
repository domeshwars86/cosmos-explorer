/**
 * Relativity Lab — two related demonstrations. Gravitational time dilation
 * is shown as a simplified illustrative relationship (a real Schwarzschild
 * calculation needs actual mass and radius, not a 0–100 slider — this is
 * explicitly a conceptual visualization, per the tab's badge). Interstellar
 * travel time IS real special-relativistic math: the Lorentz factor
 * γ = 1 / √(1 − v²/c²) correctly relates Earth-frame time to the time
 * experienced by a traveling crew at a given constant speed.
 */
const DESTINATIONS = [
  { id: 'proxima', name: 'Proxima Centauri', ly: 4.24 },
  { id: 'sirius', name: 'Sirius', ly: 8.6 },
  { id: 'vega', name: 'Vega', ly: 25 },
  { id: 'betelgeuse', name: 'Betelgeuse', ly: 548 },
];

export function initTimeDilation() {
  const slider = document.getElementById('td-strength');
  if (!slider) return;
  const valEl = document.getElementById('td-strength-val');
  const clockBEl = document.getElementById('td-clock-b');

  function update() {
    const strength = parseFloat(slider.value);
    valEl.textContent = `${strength}%`;
    const factor = 1 - (strength / 100) * 0.9;
    clockBEl.textContent = `${factor.toFixed(3)} sec / sec`;
  }
  slider.addEventListener('input', update);
  update();
}

export function initInterstellarTravel() {
  const destSel = document.getElementById('it-destination');
  if (!destSel) return;
  const speedSel = document.getElementById('it-speed');
  const resultsEl = document.getElementById('it-results');

  destSel.innerHTML = DESTINATIONS.map((d) => `<option value="${d.id}">${d.name} (${d.ly} ly)</option>`).join('');

  function update() {
    const dest = DESTINATIONS.find((d) => d.id === destSel.value);
    const v = parseFloat(speedSel.value);
    const earthYears = dest.ly / v;
    const gamma = 1 / Math.sqrt(1 - v * v);
    const shipYears = earthYears / gamma;
    const arrivalYear = new Date().getFullYear() + Math.round(earthYears);

    resultsEl.innerHTML = `
      <div class="calc-result-card"><div class="body-name"><span class="dot"></span>Earth-Frame Travel Time</div><div class="body-value">${earthYears.toLocaleString(undefined, { maximumFractionDigits: 1 })} yrs</div></div>
      <div class="calc-result-card"><div class="body-name"><span class="dot"></span>Crew-Experienced Time</div><div class="body-value">${shipYears.toLocaleString(undefined, { maximumFractionDigits: 2 })} yrs</div></div>
      <div class="calc-result-card"><div class="body-name"><span class="dot"></span>Lorentz Factor (γ)</div><div class="body-value">${gamma.toFixed(3)}</div></div>
      <div class="calc-result-card"><div class="body-name"><span class="dot"></span>Approx. Arrival Year (Earth)</div><div class="body-value">${arrivalYear}</div></div>
    `;
  }

  destSel.addEventListener('change', update);
  speedSel.addEventListener('change', update);
  update();
}

/**
 * Habitability Lab — a deterministic, transparent scoring model over five
 * adjustable environmental factors. It never claims life exists; the only
 * possible outputs describe how favorable the *conditions* are, per
 * MASTER PROMPT §20 ("Potentially habitable," never "there is life").
 */
export function initHabitabilityLab() {
  const tempSlider = document.getElementById('hab-temp');
  if (!tempSlider) return;
  const pressureSlider = document.getElementById('hab-pressure');
  const waterSlider = document.getElementById('hab-water');
  const radiationSlider = document.getElementById('hab-radiation');
  const energyToggle = document.getElementById('hab-energy');

  const tempVal = document.getElementById('hab-temp-val');
  const pressureVal = document.getElementById('hab-pressure-val');
  const waterVal = document.getElementById('hab-water-val');
  const radiationVal = document.getElementById('hab-radiation-val');
  const overallEl = document.getElementById('hab-overall');
  const breakdownEl = document.getElementById('hab-breakdown');

  function scoreTemp(t) {
    if (t >= -20 && t <= 50) return { s: 1, label: 'Favorable for liquid water' };
    if (t >= -60 && t < -20 || t > 50 && t <= 100) return { s: 0.5, label: 'Marginal — near the edges of liquid water range' };
    return { s: 0, label: 'Extreme — outside the plausible range for liquid water' };
  }
  function scorePressure(p) {
    if (p >= 50 && p <= 300) return { s: 1, label: 'Within range that can sustain surface liquid water' };
    if (p >= 10 && p < 50 || p > 300 && p <= 450) return { s: 0.5, label: 'Marginal atmospheric pressure' };
    return { s: 0, label: 'Too thin or too extreme for stable surface liquid' };
  }
  function scoreWater(w) {
    const s = w / 100;
    const label = w < 10 ? 'None / trace' : w < 40 ? 'Limited availability' : 'Abundant';
    return { s, label };
  }
  function scoreRadiation(r) {
    const s = 1 - r / 100;
    const label = r < 25 ? 'Low — comparable to a shielded world' : r < 65 ? 'Moderate' : 'High — significant shielding would be required';
    return { s, label };
  }

  function update() {
    const temp = parseFloat(tempSlider.value);
    const pressure = parseFloat(pressureSlider.value);
    const water = parseFloat(waterSlider.value);
    const radiation = parseFloat(radiationSlider.value);
    const energy = energyToggle.checked;

    tempVal.textContent = `${temp}°C`;
    pressureVal.textContent = `${pressure}% Earth`;
    waterVal.textContent = `${water}%`;
    radiationVal.textContent = `${radiation}%`;

    const t = scoreTemp(temp), p = scorePressure(pressure), w = scoreWater(water), r = scoreRadiation(radiation);
    let overall = (t.s * 0.3 + p.s * 0.2 + w.s * 0.3 + r.s * 0.2);
    if (!energy) overall *= 0.3;

    let label;
    if (overall >= 0.75) label = 'Highly Favorable (Earth-like)';
    else if (overall >= 0.5) label = 'Potentially Habitable';
    else if (overall >= 0.25) label = 'Marginally Habitable';
    else label = 'Not Habitable';

    overallEl.textContent = label;
    breakdownEl.innerHTML = [
      ['Temperature', t], ['Atmospheric Pressure', p], ['Liquid Water', w], ['Radiation Shielding', r],
    ].map(([name, res]) => `
      <div class="row between" style="font-size:0.84rem;">
        <span class="text-secondary">${name}</span>
        <span style="color:${res.s >= 0.6 ? 'var(--success)' : res.s >= 0.3 ? 'var(--gold)' : 'var(--danger)'};">${res.label}</span>
      </div>`).join('') + `
      <div class="row between" style="font-size:0.84rem;">
        <span class="text-secondary">Energy Source</span>
        <span style="color:${energy ? 'var(--success)' : 'var(--danger)'};">${energy ? 'Present' : 'Absent — severely limiting'}</span>
      </div>`;
  }

  [tempSlider, pressureSlider, waterSlider, radiationSlider].forEach((el) => el.addEventListener('input', update));
  energyToggle.addEventListener('change', update);
  update();
}

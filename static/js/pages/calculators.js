/**
 * "How much would you weigh?" and "How old would you be?" calculators.
 * Both call real backend endpoints (app/services/calculator_service.py) —
 * nothing here is hard-coded or faked (MASTER PROMPT §83).
 */

let colorMap = { moon: '#C9C9C9' };

async function loadColors() {
  try {
    const res = await fetch('/api/planets');
    const body = await res.json();
    (body.data || []).forEach((p) => { colorMap[p.id] = p.color; });
  } catch (err) { /* fall back to default accent dots */ }
}

function renderResults(container, results, valueKey, formatter) {
  container.innerHTML = results.map((r) => `
    <div class="calc-result-card" style="--dot-color:${colorMap[r.id] || '#7c8cff'};">
      <div class="body-name"><span class="dot"></span>${r.name}</div>
      <div class="body-value">${formatter(r[valueKey])}</div>
    </div>
  `).join('');
}

function setError(el, message) {
  el.textContent = message || '';
  el.classList.toggle('visible', !!message);
}

async function initWeight() {
  const input = document.getElementById('weight-input');
  const btn = document.getElementById('weight-submit');
  const errorEl = document.getElementById('weight-error');
  const results = document.getElementById('weight-results');
  const disclaimer = document.getElementById('weight-disclaimer');
  if (!btn) return;

  async function run() {
    setError(errorEl, '');
    const weight = parseFloat(input.value);
    if (!weight || weight <= 0) { setError(errorEl, 'Enter your weight on Earth (a positive number) first.'); return; }
    try {
      const res = await fetch(`/api/calculate/weight?weight=${encodeURIComponent(weight)}`);
      const body = await res.json();
      if (!body.ok) { setError(errorEl, body.error); results.innerHTML = ''; return; }
      renderResults(results, body.data.results, 'equivalent_weight', (v) => `${v} kg`);
      disclaimer.textContent = body.data.disclaimer;
    } catch (err) {
      setError(errorEl, 'Unable to reach the calculator right now.');
    }
  }
  btn.addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
}

async function initAge() {
  const input = document.getElementById('age-input');
  const btn = document.getElementById('age-submit');
  const errorEl = document.getElementById('age-error');
  const results = document.getElementById('age-results');
  const disclaimer = document.getElementById('age-disclaimer');
  if (!btn) return;

  async function run() {
    setError(errorEl, '');
    const age = parseFloat(input.value);
    if (age === '' || isNaN(age) || age < 0) { setError(errorEl, 'Enter your age in Earth years first.'); return; }
    try {
      const res = await fetch(`/api/calculate/age?age=${encodeURIComponent(age)}`);
      const body = await res.json();
      if (!body.ok) { setError(errorEl, body.error); results.innerHTML = ''; return; }
      renderResults(results, body.data.results, 'age', (v) => `${v}`);
      disclaimer.textContent = body.data.disclaimer;
    } catch (err) {
      setError(errorEl, 'Unable to reach the calculator right now.');
    }
  }
  btn.addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
}

async function init() {
  await loadColors();
  initWeight();
  initAge();
}
init();

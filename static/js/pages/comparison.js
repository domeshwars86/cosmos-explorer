/**
 * Planet comparison tool: pick 2–4 planets, fetch /api/compare, and render
 * a size-comparison row plus a full statistics table with proportional bars.
 */
const MIN = 2, MAX = 4;
let selected = [];

function updateChips() {
  document.querySelectorAll('.compare-chip').forEach((chip) => {
    const id = chip.dataset.id;
    const isSelected = selected.includes(id);
    chip.classList.toggle('selected', isSelected);
    chip.disabled = !isSelected && selected.length >= MAX;
  });
  const hint = document.getElementById('compare-hint');
  if (selected.length < MIN) hint.textContent = `Select at least ${MIN} planets (up to ${MAX}). ${selected.length}/${MAX} selected.`;
  else hint.textContent = `${selected.length}/${MAX} planets selected.`;
}

async function runCompare() {
  const output = document.getElementById('compare-output');
  if (selected.length < MIN) { output.innerHTML = ''; return; }
  output.innerHTML = '<p class="text-muted">Loading comparison…</p>';
  try {
    const res = await fetch(`/api/compare?planets=${selected.join(',')}`);
    const body = await res.json();
    if (!body.ok) { output.innerHTML = `<p class="calc-error visible">${body.error}</p>`; return; }
    render(body.data, output);
  } catch (err) {
    output.innerHTML = '<p class="calc-error visible">Unable to load comparison right now.</p>';
  }
}

function render(data, output) {
  const maxDiameter = Math.max(...data.planets.map((p, i) => data.rows[0].values[i]));
  const sizeRow = `
    <div class="panel reveal in-view" style="padding:2rem;">
      <h3 style="margin-bottom:0.5rem;">Relative Size</h3>
      <p class="text-muted" style="font-size:0.8rem;">Diameters shown proportionally to each other (not to real screen scale).</p>
      <div class="size-compare-row">
        ${data.planets.map((p, i) => {
          const d = data.rows[0].values[i];
          const px = 26 + (d / maxDiameter) * 130;
          return `<div class="size-compare-item">
            <span class="planet-orb" style="--orb-color:${p.color}; --orb-size:${px}px;"></span>
            <span class="text-secondary" style="font-size:0.85rem;">${p.name}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  const table = `
    <div class="compare-table-wrap reveal in-view" style="margin-top:1.5rem;">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Statistic</th>
            ${data.planets.map((p) => `<th><span style="display:inline-flex; align-items:center; gap:0.5rem;"><span class="planet-orb" style="--orb-color:${p.color}; --orb-size:16px;"></span>${p.name}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map((row) => `
            <tr>
              <th>${row.label}</th>
              ${row.values.map((v) => {
                const isMax = typeof v === 'number' && row.max !== null && v === row.max;
                const pct = row.max ? Math.max(4, (v / row.max) * 100) : 0;
                const display = typeof v === 'number' ? formatNumber(v) : (v ?? '—');
                return `<td class="${isMax ? 'best' : ''}">
                  <span class="bar-wrap">
                    <span>${display}${row.unit ? ' ' + row.unit : ''}</span>
                    ${typeof v === 'number' ? `<span class="bar-track"><span class="bar-fill" style="width:${pct}%;"></span></span>` : ''}
                  </span>
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
          <tr>
            <th>Rings</th>
            ${data.planets.map((p) => `<td>${p.rings ? 'Yes' : 'No'}</td>`).join('')}
          </tr>
          <tr>
            <th>Atmosphere</th>
            ${data.planets.map((p) => `<td style="white-space:normal; max-width:220px;">${p.atmosphere}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-muted" style="font-size:0.76rem; margin-top:0.8rem;">Highlighted values mark the highest number in each row — not necessarily "better." Figures are approximate; see each planet's page for full detail.</p>`;

  output.innerHTML = sizeRow + table;
}

function formatNumber(v) {
  if (Math.abs(v) >= 1000) return v.toLocaleString();
  return v;
}

function init() {
  document.querySelectorAll('.compare-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      if (selected.includes(id)) {
        selected = selected.filter((x) => x !== id);
      } else if (selected.length < MAX) {
        selected.push(id);
      }
      updateChips();
      runCompare();
    });
  });

  // Pre-select Earth + Mars as a helpful default
  selected = ['earth', 'mars'];
  updateChips();
  runCompare();
}

init();

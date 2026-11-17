/**
 * Mission Builder — populates its dropdowns from the real dataset via
 * /api/mission-builder/options, then generates a mission profile from
 * /api/mission-builder (app/services/mission_builder_service.py).
 */
async function loadOptions() {
  const res = await fetch('/api/mission-builder/options');
  const body = await res.json();
  return body.data;
}

function fillSelect(el, items, valueKey, labelKey) {
  el.innerHTML = items.map((i) => `<option value="${i[valueKey]}">${i[labelKey]}${i.kind ? ` (${i.kind})` : ''}</option>`).join('');
}

async function init() {
  const destSel = document.getElementById('mb-destination');
  const typeSel = document.getElementById('mb-type');
  const craftSel = document.getElementById('mb-spacecraft');
  const objSel = document.getElementById('mb-objective');
  if (!destSel) return;

  const options = await loadOptions();
  fillSelect(destSel, options.destinations, 'id', 'name');
  fillSelect(typeSel, options.mission_types, 'id', 'label');
  fillSelect(craftSel, options.spacecraft_types, 'id', 'label');
  fillSelect(objSel, options.objectives, 'id', 'label');
  destSel.value = 'mars';
  typeSel.value = 'rover';
  craftSel.value = 'rover_class';
  objSel.value = 'water';

  document.getElementById('mb-build').addEventListener('click', async () => {
    const params = new URLSearchParams({
      destination: destSel.value, mission_type: typeSel.value,
      spacecraft_type: craftSel.value, objective: objSel.value,
    });
    const res = await fetch(`/api/mission-builder?${params}`);
    const body = await res.json();
    if (!body.ok) return;
    render(body.data);
    window.COSMOS?.achievements?.track('mission_built');
    window.COSMOS?.blip?.(700, 0.1);
  });
}

function render(m) {
  const output = document.getElementById('mb-output');
  output.classList.remove('hidden');
  document.getElementById('mb-name').textContent = m.mission_name;
  document.getElementById('mb-out-dest').textContent = m.destination.name;
  document.getElementById('mb-out-type').textContent = m.mission_type;
  document.getElementById('mb-out-craft').textContent = m.spacecraft_type;
  document.getElementById('mb-out-travel').textContent = m.travel_estimate_label;
  document.getElementById('mb-disclaimer').textContent = m.disclaimer;
  document.getElementById('mb-out-link').href = m.destination.url;

  document.getElementById('mb-stages').innerHTML = m.stages.map((s) => `
    <div class="timeline-item in-view">
      <div class="timeline-year">${s.stage.toUpperCase()}</div>
      <div class="timeline-card panel" style="cursor:default;"><p class="text-secondary" style="font-size:0.9rem;">${s.description}</p></div>
    </div>
  `).join('');

  output.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

init();

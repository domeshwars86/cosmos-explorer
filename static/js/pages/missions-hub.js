/**
 * Global Space Exploration hub — powers the live-filterable mission
 * library grid on /explore. The chronological timeline below it is a
 * separate, unchanged, server-rendered section (see static/js/pages/timeline.js)
 * so existing deep-links like /explore#voyager keep working exactly as before.
 */
import { renderMissionCard } from '../core/mission-render.js';

const countriesById = {};
(window.__COUNTRIES__ || []).forEach((c) => { countriesById[c.id] = c; });

const state = { country: '', agency: '', destination: '', type: '', status: '' };

function skeletons(n) {
  return new Array(n).fill('<div class="news-skeleton"><div class="sk-image"></div><div class="sk-line"></div><div class="sk-line"></div></div>').join('');
}

async function loadMissions() {
  const grid = document.getElementById('mission-grid');
  grid.innerHTML = skeletons(6);

  const params = new URLSearchParams();
  if (state.country) params.set('country', state.country);
  if (state.agency) params.set('agency', state.agency);
  if (state.destination) params.set('destination', state.destination);
  if (state.type) params.set('type', state.type);
  if (state.status) params.set('status', state.status);

  try {
    const res = await fetch(`/api/missions?${params}`);
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error();
    const missions = body.data;
    if (missions.length === 0) {
      grid.innerHTML = `
        <div class="news-empty" style="grid-column:1/-1;">
          <h3>NO SIGNAL</h3>
          <p class="text-secondary" style="margin-top:0.6rem;">No missions matched your current filters.</p>
          <button type="button" class="btn btn-outline btn-sm" style="margin-top:1.2rem;" id="mission-clear-inline">Clear Filters</button>
        </div>`;
      document.getElementById('mission-clear-inline')?.addEventListener('click', clearFilters);
      return;
    }
    grid.innerHTML = missions.map((m) => renderMissionCard(m, countriesById)).join('');
  } catch (err) {
    grid.innerHTML = '<div class="news-empty" style="grid-column:1/-1;"><h3>MISSION DATA UNAVAILABLE</h3><p class="text-secondary" style="margin-top:0.6rem;">Please try again shortly.</p></div>';
  }
}

function clearFilters() {
  state.country = ''; state.agency = ''; state.destination = ''; state.type = ''; state.status = '';
  ['filter-country', 'filter-agency', 'filter-destination', 'filter-type', 'filter-status'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  loadMissions();
}

function init() {
  const grid = document.getElementById('mission-grid');
  if (!grid) return;

  document.getElementById('filter-country')?.addEventListener('change', (e) => { state.country = e.target.value; loadMissions(); });
  document.getElementById('filter-agency')?.addEventListener('change', (e) => { state.agency = e.target.value; loadMissions(); });
  document.getElementById('filter-destination')?.addEventListener('change', (e) => { state.destination = e.target.value; loadMissions(); });
  document.getElementById('filter-type')?.addEventListener('change', (e) => { state.type = e.target.value; loadMissions(); });
  document.getElementById('filter-status')?.addEventListener('change', (e) => { state.status = e.target.value; loadMissions(); });
  document.getElementById('filter-clear')?.addEventListener('click', clearFilters);

  loadMissions();
}

init();

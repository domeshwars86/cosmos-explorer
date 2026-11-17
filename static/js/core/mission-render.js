/**
 * Reusable mission & country card renderers for the Global Space
 * Exploration hub (/explore), country profile pages, and anywhere else a
 * mission needs to appear — one implementation instead of a separate
 * hard-coded card per agency (MASTER PROMPT: "cards must work for every
 * agency... do not create separate hard-coded card implementations").
 */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function statusClass(statusCategory) {
  return `status-${String(statusCategory || 'Active').replace(/\s+/g, '-')}`;
}

export function renderMissionCard(m, countriesById) {
  const country = countriesById ? countriesById[m.country_id] : null;
  const flag = country ? country.flag : '🌐';
  const countryName = country ? country.name : 'International';
  return `
    <a class="mission-card" href="/mission/${m.id}">
      <div class="mission-card-top">
        <span class="mission-flag" aria-hidden="true">${flag}</span>
        <span class="text-muted">${escapeHtml(countryName)}</span>
        <span style="margin-left:auto;" class="status-pill ${statusClass(m.status_category)}">${escapeHtml(m.status_category || m.status)}</span>
      </div>
      <div class="mission-card-title">${escapeHtml(m.name)}</div>
      <div class="mission-card-meta">
        <span>Agency<br><b>${escapeHtml(m.agency)}</b></span>
        <span>Type<br><b>${escapeHtml(m.mission_type || m.type)}</b></span>
        <span>Destination<br><b>${escapeHtml(m.destination || m.target)}</b></span>
        <span>Year<br><b>${m.year}</b></span>
      </div>
      <div class="mission-card-footer">
        <span class="text-accent" style="font-size:0.82rem;">Explore Mission →</span>
      </div>
    </a>`;
}

export function renderCountryCard(c, missionCount) {
  return `
    <a class="country-card" href="/country/${c.id}">
      <div class="country-flag" aria-hidden="true">${c.flag}</div>
      <div style="font-family:var(--font-display); font-size:0.98rem;">${escapeHtml(c.name)}</div>
      <div class="country-mission-count">${missionCount} mission${missionCount === 1 ? '' : 's'} tracked</div>
    </a>`;
}

export { statusClass, escapeHtml };

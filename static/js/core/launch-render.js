import { escapeHtml, formatISTDate, formatISTDateTime, safeHttpUrl } from './format.js';

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('success')) return 'launch-status-success';
  if (s.includes('go')) return 'launch-status-go';
  if (s.includes('tbd') || s.includes('hold')) return 'launch-status-tbd';
  return '';
}

export function renderLaunchCard(launch) {
  const sourceUrl = safeHttpUrl(launch.source_url);
  const launchTime = launch.time_is_precise
    ? formatISTDateTime(launch.net)
    : `Target: ${launch.net ? formatISTDate(launch.net) : 'TBD'}`;
  const sourceLink = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="text-accent" style="font-size:0.82rem; margin-top:0.8rem; display:inline-block;">Source: ${escapeHtml(launch.source)} →</a>`
    : '';

  return `
    <div class="launch-card reveal in-view">
      <div class="row between wrap" style="align-items:flex-start; gap:0.8rem;">
        <div>
          <h3 style="font-size:1.1rem;">${escapeHtml(launch.name)}</h3>
          <p class="text-muted" style="font-size:0.82rem; margin-top:0.3rem;">${escapeHtml(launch.agency)} · ${escapeHtml(launch.rocket)}</p>
        </div>
        <span class="launch-status-badge ${statusClass(launch.status)}">${escapeHtml(launch.status)}</span>
      </div>
      <div class="row wrap gap-md" style="margin-top:1rem; font-size:0.82rem; color:var(--text-secondary);">
        <span>${launchTime}</span>
        <span>${escapeHtml(launch.location)}</span>
        <span>${escapeHtml(launch.mission_type)}${launch.orbit ? ` · ${escapeHtml(launch.orbit)}` : ''}</span>
      </div>
      ${launch.description ? `<p class="text-secondary" style="margin-top:0.8rem; font-size:0.86rem;">${escapeHtml(launch.description)}</p>` : ''}
      ${sourceLink}
    </div>
  `;
}

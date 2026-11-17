/**
 * Upcoming Launches — via COSMOS's own /api/launches/upcoming (backed by
 * Launch Library 2). Only shows a literal countdown when the scheduled
 * time is precise; otherwise shows "Target Date" instead of a misleading
 * countdown (MASTER PROMPT §24).
 */
let countdownTimer = null;

function statusClass(status) {
  const s = status.toLowerCase();
  if (s.includes('success')) return 'launch-status-success';
  if (s.includes('go')) return 'launch-status-go';
  if (s.includes('tbd') || s.includes('hold')) return 'launch-status-tbd';
  return '';
}

function formatCountdown(ms) {
  if (ms <= 0) return 'LIFTOFF WINDOW';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `T-${pad(days)}:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function renderNextLaunch(launch) {
  const panel = document.getElementById('next-launch-panel');
  if (!launch) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  document.getElementById('next-launch-name').textContent = launch.name;

  if (launch.time_is_precise && launch.net) {
    const target = new Date(launch.net).getTime();
    document.getElementById('next-launch-precision').textContent = `Scheduled: ${new Date(launch.net).toLocaleString()}`;
    clearInterval(countdownTimer);
    function tick() {
      document.getElementById('next-launch-countdown').textContent = formatCountdown(target - Date.now());
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  } else {
    document.getElementById('next-launch-countdown').textContent = 'TARGET DATE';
    document.getElementById('next-launch-precision').textContent = launch.net ? `Target: ${new Date(launch.net).toLocaleDateString()} (time not yet precise)` : 'Date to be determined';
  }
}

function renderList(launches) {
  const list = document.getElementById('launches-list');
  if (launches.length === 0) {
    list.innerHTML = '<div class="news-empty"><h3>NO SIGNAL</h3><p class="text-secondary" style="margin-top:0.6rem;">No upcoming launch data available right now.</p></div>';
    return;
  }
  list.innerHTML = launches.map((l) => `
    <div class="launch-card reveal in-view">
      <div class="row between wrap" style="align-items:flex-start; gap:0.8rem;">
        <div>
          <h3 style="font-size:1.1rem;">${l.name}</h3>
          <p class="text-muted" style="font-size:0.82rem; margin-top:0.3rem;">${l.agency} · ${l.rocket}</p>
        </div>
        <span class="launch-status-badge ${statusClass(l.status)}">${l.status}</span>
      </div>
      <div class="row wrap gap-md" style="margin-top:1rem; font-size:0.82rem; color:var(--text-secondary);">
        <span>${l.time_is_precise ? new Date(l.net).toLocaleString() : `Target: ${l.net ? new Date(l.net).toLocaleDateString() : 'TBD'}`}</span>
        <span>${l.location}</span>
        <span>${l.mission_type}${l.orbit ? ` · ${l.orbit}` : ''}</span>
      </div>
      ${l.description ? `<p class="text-secondary" style="margin-top:0.8rem; font-size:0.86rem;">${l.description}</p>` : ''}
      <a href="${l.source_url}" target="_blank" rel="noopener noreferrer" class="text-accent" style="font-size:0.82rem; margin-top:0.8rem; display:inline-block;">Source: ${l.source} →</a>
    </div>
  `).join('');
}

async function init() {
  try {
    const res = await fetch('/api/launches/upcoming?limit=15');
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error();
    const launches = body.data.items;
    renderNextLaunch(launches[0]);
    renderList(launches.slice(1));
    if (body.data.last_refreshed) {
      document.getElementById('launches-updated').textContent = `LAST UPDATED ${new Date(body.data.last_refreshed * 1000).toISOString().slice(11, 16)} UTC · SOURCE: LAUNCH LIBRARY 2`;
    }
  } catch (err) {
    document.getElementById('launches-list').innerHTML = '<div class="news-empty"><h3>LAUNCH DATA TEMPORARILY UNAVAILABLE</h3></div>';
  }
}

init();

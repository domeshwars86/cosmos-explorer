/**
 * Upcoming Launches — via COSMOS's own /api/launches/upcoming (backed by
 * Launch Library 2). Only shows a literal countdown when the scheduled
 * time is precise; otherwise shows "Target Date" instead of a misleading
 * countdown (MASTER PROMPT §24).
 */
import { formatISTDate, formatISTDateTime, formatISTTime } from '../core/format.js';
import { renderLaunchCard } from '../core/launch-render.js';

let countdownTimer = null;

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
    document.getElementById('next-launch-precision').textContent = `Scheduled: ${formatISTDateTime(launch.net)}`;
    clearInterval(countdownTimer);
    function tick() {
      document.getElementById('next-launch-countdown').textContent = formatCountdown(target - Date.now());
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  } else {
    document.getElementById('next-launch-countdown').textContent = 'TARGET DATE';
    document.getElementById('next-launch-precision').textContent = launch.net ? `Target: ${formatISTDate(launch.net)} (time not yet precise)` : 'Date to be determined';
  }
}

function renderList(launches) {
  const list = document.getElementById('launches-list');
  if (launches.length === 0) {
    list.innerHTML = '<div class="news-empty"><h3>NO SIGNAL</h3><p class="text-secondary" style="margin-top:0.6rem;">No upcoming launch data available right now.</p></div>';
    return;
  }
  list.innerHTML = launches.map(renderLaunchCard).join('');
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
      document.getElementById('launches-updated').textContent = `LAST UPDATED ${formatISTTime(body.data.last_refreshed * 1000)} · SOURCE: LAUNCH LIBRARY 2`;
    }
  } catch (err) {
    document.getElementById('launches-list').innerHTML = '<div class="news-empty"><h3>LAUNCH DATA TEMPORARILY UNAVAILABLE</h3></div>';
  }
}

init();

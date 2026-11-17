/**
 * Cosmic Timeline — a logarithmic-scale slider across 13.8 billion years,
 * from the Big Bang to today. Reuses the same .scale-journey component
 * pattern as the Galaxy page's scale-of-the-universe journey.
 */
const CONFIDENCE_CLASS = { observed: 'confidence-observed', measured: 'confidence-measured', estimated: 'confidence-estimated', modeled: 'confidence-modeled', conceptual: 'confidence-conceptual' };

async function fetchTimeline() {
  const res = await fetch('/api/cosmic-timeline');
  const body = await res.json();
  return body.data;
}

function formatYearsAgo(y) {
  if (y === 0) return 'Today';
  if (y >= 1_000_000_000) return `${(y / 1_000_000_000).toFixed(2)} billion years ago`;
  if (y >= 1_000_000) return `${(y / 1_000_000).toFixed(0)} million years ago`;
  if (y >= 1000) return `${(y / 1000).toFixed(0)},000 years ago`.replace(',000,000', '0,000');
  return `${y.toLocaleString()} years ago`;
}

function init(items) {
  const track = document.getElementById('timeline-track');
  const label = document.getElementById('timeline-detail-label');
  const title = document.getElementById('timeline-detail-title');
  const desc = document.getElementById('timeline-detail-desc');
  const confidenceEl = document.getElementById('timeline-detail-confidence');
  const prevBtn = document.getElementById('timeline-prev');
  const nextBtn = document.getElementById('timeline-next');
  if (!track) return;

  const fill = document.createElement('div');
  fill.className = 'scale-track-fill';
  track.appendChild(fill);

  const logs = items.map((i) => Math.log10(i.years_ago + 1));
  const maxLog = Math.max(...logs), minLog = Math.min(...logs);
  const pct = (log) => ((maxLog - log) / (maxLog - minLog)) * 100;

  let active = items.length - 1; // start at "today"
  const markers = items.map((item, i) => {
    const m = document.createElement('button');
    m.type = 'button';
    m.className = 'scale-marker';
    m.style.left = `${pct(logs[i])}%`;
    m.setAttribute('aria-label', item.label);
    m.addEventListener('click', () => select(i));
    track.appendChild(m);
    return m;
  });

  function select(i) {
    active = Math.max(0, Math.min(items.length - 1, i));
    const item = items[active];
    markers.forEach((m, idx) => m.classList.toggle('active', idx === active));
    fill.style.width = `${pct(logs[active])}%`;
    label.textContent = formatYearsAgo(item.years_ago);
    title.textContent = item.label;
    desc.textContent = item.description;
    confidenceEl.textContent = item.confidence.toUpperCase();
    confidenceEl.className = `confidence-badge ${CONFIDENCE_CLASS[item.confidence] || 'confidence-modeled'}`;
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === items.length - 1;
  }

  prevBtn.addEventListener('click', () => select(active - 1));
  nextBtn.addEventListener('click', () => select(active + 1));
  select(active);
}

fetchTimeline().then(init).catch(() => {
  const track = document.getElementById('timeline-track');
  if (track) track.parentElement.innerHTML = '<p class="text-muted">Unable to load the timeline right now.</p>';
});

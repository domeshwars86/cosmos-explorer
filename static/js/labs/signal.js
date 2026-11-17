/**
 * Signal & Light-Speed Lab — combines three related ideas from the brief
 * (light-speed travel time, deep-space communication delay, and "sending a
 * message to the universe") into one lab, since they're really the same
 * physics concept viewed three ways. Real light-speed math; the on-screen
 * "transmit" animation is deliberately time-compressed (see disclaimer in
 * the template) — no message is actually sent anywhere.
 */
const C_KM_S = 299792;

// Approximate representative distances — real Earth-to-planet distance
// varies constantly as both bodies orbit the Sun.
const DESTINATIONS = [
  { id: 'moon', name: 'The Moon', distanceKm: 384400 },
  { id: 'sun', name: 'The Sun', distanceKm: 149600000 },
  { id: 'mars', name: 'Mars (approx. average)', distanceKm: 225000000 },
  { id: 'jupiter', name: 'Jupiter (approx. average)', distanceKm: 628000000 },
  { id: 'saturn', name: 'Saturn (approx. average)', distanceKm: 1275000000 },
  { id: 'uranus', name: 'Uranus (approx. average)', distanceKm: 2720000000 },
  { id: 'neptune', name: 'Neptune (approx. average)', distanceKm: 4350000000 },
  { id: 'proxima', name: 'Proxima Centauri', distanceKm: 4.24 * 9_460_730_472_580.8 },
];

function formatSeconds(s) {
  if (s < 60) return `${s.toFixed(1)} seconds`;
  if (s < 3600) return `${(s / 60).toFixed(1)} minutes`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hours`;
  const days = s / 86400;
  if (days < 365.25) return `${days.toFixed(1)} days`;
  return `${(days / 365.25).toFixed(2)} years`;
}

export function initSignalLab() {
  const select = document.getElementById('signal-destination');
  if (!select) return;
  const resultEl = document.getElementById('signal-delay-result');
  const transmitBtn = document.getElementById('signal-transmit');
  const messageInput = document.getElementById('signal-message');
  const logEl = document.getElementById('signal-log');

  select.innerHTML = DESTINATIONS.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
  select.value = 'mars';

  function current() { return DESTINATIONS.find((d) => d.id === select.value); }

  function updateDelay() {
    const dest = current();
    const oneWay = dest.distanceKm / C_KM_S;
    resultEl.innerHTML = `
      <div class="calc-result-card"><div class="body-name"><span class="dot" style="background:var(--accent);"></span>One-Way Light Time</div><div class="body-value">${formatSeconds(oneWay)}</div></div>
      <div class="calc-result-card"><div class="body-name"><span class="dot" style="background:var(--accent);"></span>Round-Trip Delay</div><div class="body-value">${formatSeconds(oneWay * 2)}</div></div>
    `;
  }

  function log(line) {
    logEl.style.display = 'block';
    logEl.innerHTML += `<div>${line}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function transmit() {
    const dest = current();
    const oneWay = dest.distanceKm / C_KM_S;
    const msg = (messageInput.value || 'Hello, Universe').slice(0, 60);
    transmitBtn.disabled = true;
    logEl.innerHTML = '';
    log(`&gt; MESSAGE TRANSMITTED: "${msg}"`);
    log(`&gt; TRAVELING toward ${dest.name}…`);

    const animMs = Math.min(3800, 500 + Math.log10(oneWay + 1) * 420);
    setTimeout(() => {
      log(`&gt; SIGNAL ARRIVED at ${dest.name} — real one-way delay: ${formatSeconds(oneWay)}`);
      log(`&gt; A reply would take another ${formatSeconds(oneWay)} to return — round trip: ${formatSeconds(oneWay * 2)}`);
      transmitBtn.disabled = false;
    }, animMs);
  }

  select.addEventListener('change', updateDelay);
  transmitBtn.addEventListener('click', transmit);
  updateDelay();
}

/**
 * Stellar Evolution Lab — a star's life cycle is determined almost
 * entirely by its initial mass. This lab shows the three broad outcomes
 * side by side rather than simulating individual stellar physics.
 */
const PATHS = {
  low: {
    lifetime: '~1–10 trillion years (longer than the current age of the universe — no low-mass star has ever died)',
    stages: ['Nebula', 'Protostar', 'Red Dwarf (Main Sequence)', 'White Dwarf (theoretical — not yet observed)'],
  },
  sunlike: {
    lifetime: '~10 billion years',
    stages: ['Nebula', 'Protostar', 'Main Sequence (like the Sun)', 'Red Giant', 'Planetary Nebula', 'White Dwarf'],
  },
  high: {
    lifetime: '~3–30 million years',
    stages: ['Nebula', 'Protostar', 'Main Sequence (massive, hot, blue)', 'Supergiant', 'Supernova', 'Neutron Star or Black Hole'],
  },
};

export function initStellarLab() {
  const switcher = document.getElementById('stellar-mass');
  if (!switcher) return;
  const pathEl = document.getElementById('stellar-path');
  const lifetimeEl = document.getElementById('stellar-lifetime');

  function render(mass) {
    const p = PATHS[mass];
    pathEl.innerHTML = p.stages.map((s, i) => `
      ${i > 0 ? '<span class="text-muted">&rarr;</span>' : ''}
      <span class="badge">${s}</span>
    `).join('');
    lifetimeEl.textContent = p.lifetime;
  }

  switcher.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      switcher.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
      render(btn.dataset.mass);
    });
  });

  render('sunlike');
}

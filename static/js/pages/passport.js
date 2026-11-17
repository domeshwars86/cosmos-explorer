/**
 * Explorer Passport — reads the same localStorage-backed progress used by
 * the Mission HUD's mini exploration log (window.COSMOS.achievements) and
 * presents it as a full page with a calculated rank.
 */
(function () {
  'use strict';

  const RANKS = [
    { min: 0, name: 'Cadet' },
    { min: 20, name: 'Trainee Explorer' },
    { min: 40, name: 'Field Explorer' },
    { min: 65, name: 'Galactic Explorer' },
    { min: 88, name: 'COSMOS Voyager' },
  ];

  function rankFor(pct) {
    let rank = RANKS[0].name;
    RANKS.forEach((r) => { if (pct >= r.min) rank = r.name; });
    return rank;
  }

  function render() {
    if (!window.COSMOS?.achievements) return;
    const progress = window.COSMOS.achievements.getProgress();
    const unlockedCount = progress.achievements.filter((a) => a.unlocked).length;

    // Exploration Depth: a simple average across every trackable dimension —
    // not designed to be addictive or competitive, just a rough summary.
    const ratios = [
      progress.planets.done / progress.planets.total,
      progress.moons.done / progress.moons.total,
      progress.labs.done / progress.labs.total,
      unlockedCount / progress.achievements.length,
    ];
    const depthPct = Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);

    document.getElementById('passport-rank').textContent = rankFor(depthPct);
    document.getElementById('passport-depth-value').textContent = `${depthPct}%`;
    document.getElementById('passport-depth-bar').style.width = `${depthPct}%`;
    document.getElementById('passport-stats').innerHTML = `
      <div class="stat-card in-view"><div class="stat-label">Planets Visited</div><div class="stat-value">${progress.planets.done}<span class="stat-unit">/ ${progress.planets.total}</span></div></div>
      <div class="stat-card in-view"><div class="stat-label">Moons Explored</div><div class="stat-value">${progress.moons.done}<span class="stat-unit">/ ${progress.moons.total}</span></div></div>
      <div class="stat-card in-view"><div class="stat-label">Labs Completed</div><div class="stat-value">${progress.labs.done}<span class="stat-unit">/ ${progress.labs.total}</span></div></div>
      <div class="stat-card in-view"><div class="stat-label">Achievements</div><div class="stat-value">${unlockedCount}<span class="stat-unit">/ ${progress.achievements.length}</span></div></div>
    `;
    document.getElementById('passport-achievements').innerHTML = progress.achievements.map((a) => `
      <span class="achievement-badge ${a.unlocked ? 'unlocked' : ''}" title="${a.desc}">${a.unlocked ? '✦ ' : ''}${a.title}</span>
    `).join('');
  }

  document.getElementById('passport-reset')?.addEventListener('click', () => {
    window.COSMOS?.achievements?.reset();
    render();
  });

  render();
})();

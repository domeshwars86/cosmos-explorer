/**
 * Expandable mission timeline cards. Plain script — no 3D needed here.
 */
(function () {
  'use strict';
  document.querySelectorAll('[data-mission-card]').forEach((card) => {
    card.addEventListener('click', () => {
      const expanded = card.classList.toggle('expanded');
      const indicator = card.querySelector('.expand-indicator');
      if (indicator) indicator.textContent = expanded ? '−' : '+';
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const el = document.getElementById(hash);
    const card = el?.querySelector('[data-mission-card]');
    if (card) {
      card.classList.add('expanded', 'in-view');
      const indicator = card.querySelector('.expand-indicator');
      if (indicator) indicator.textContent = '−';
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    }
  }
})();

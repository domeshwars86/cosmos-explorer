/**
 * Generic accessible tab switcher for any `.tabs` / `.tab-btn` /
 * `.tab-panel[data-tab-panel]` group on the page. Plain script (not a
 * module) so it can run on pages that don't otherwise need Three.js.
 */
(function () {
  'use strict';
  function initTabs(tabsEl) {
    const buttons = Array.from(tabsEl.querySelectorAll('.tab-btn'));
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        buttons.forEach((b) => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
        document.querySelectorAll(`[data-tab-panel]`).forEach((panel) => {
          panel.classList.toggle('active', panel.dataset.tabPanel === target);
        });
        if (history.replaceState) history.replaceState(null, '', `#${target}`);
      });
    });
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const match = buttons.find((b) => b.dataset.tab === hash);
      match?.click();
    }
  }

  document.querySelectorAll('.tabs').forEach(initTabs);
})();

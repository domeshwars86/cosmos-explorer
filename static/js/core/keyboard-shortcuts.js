/**
 * Global keyboard shortcuts. Only fires when no modifier key is held and
 * focus isn't inside a text input/textarea/select — so normal browser
 * shortcuts and form typing are never hijacked (MASTER PROMPT §41).
 *
 *   Space  Play/pause the active 3D simulation (Solar System page, home preview)
 *   R      Reset the active camera view
 *   F      Toggle fullscreen
 *   M      Toggle interface sound
 *   ?      Show this shortcut list
 */
(function () {
  'use strict';

  const SHORTCUTS = [
    { keys: 'Space', desc: 'Play / pause the active simulation' },
    { keys: 'R', desc: 'Reset camera view' },
    { keys: 'F', desc: 'Toggle fullscreen' },
    { keys: 'M', desc: 'Toggle interface sound' },
    { keys: 'Ctrl/Cmd + K', desc: 'Open search' },
    { keys: '?', desc: 'Show this list' },
    { keys: 'Esc', desc: 'Close any open panel' },
  ];

  function ensureModal() {
    let modal = document.getElementById('shortcuts-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Keyboard shortcuts');
    modal.style.cssText = 'position:fixed;inset:0;z-index:220;background:rgba(4,5,10,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1.25rem;opacity:0;visibility:hidden;transition:opacity .2s;';
    modal.innerHTML = `
      <div class="search-box panel" style="padding:1.6rem;">
        <div class="row between" style="margin-bottom:1rem;">
          <h3>Keyboard Shortcuts</h3>
          <button type="button" class="icon-btn btn-sm" id="shortcuts-close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        ${SHORTCUTS.map((s) => `<div class="shortcut-row"><span>${s.desc}</span><kbd>${s.keys}</kbd></div>`).join('')}
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.getElementById('shortcuts-close').addEventListener('click', close);
    return modal;
  }

  function open() {
    const modal = ensureModal();
    modal.style.visibility = 'visible';
    requestAnimationFrame(() => { modal.style.opacity = '1'; });
  }
  function close() {
    const modal = document.getElementById('shortcuts-modal');
    if (!modal) return;
    modal.style.opacity = '0';
    setTimeout(() => { modal.style.visibility = 'hidden'; }, 200);
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function clickIfExists(selector) {
    const el = document.querySelector(selector);
    if (el) { el.click(); return true; }
    return false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // never hijack browser/OS shortcuts
    if (isTyping()) return;

    switch (e.key) {
      case ' ': {
        const played = clickIfExists('#sim-play') || clickIfExists('#preview-play');
        if (played) e.preventDefault();
        break;
      }
      case 'r': case 'R':
        clickIfExists('#sim-reset');
        break;
      case 'f': case 'F':
        clickIfExists('#fullscreen-toggle');
        break;
      case 'm': case 'M':
        clickIfExists('#sound-toggle');
        break;
      case '?':
        open();
        break;
      case 'Escape':
        close();
        break;
      default:
        break;
    }
  });
})();

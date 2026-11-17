/**
 * Shared settings store, persisted to localStorage. Exposed as
 * window.COSMOS.settings so every other script (starfield, 3D scenes,
 * settings panel UI) can read/write the same preferences.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cosmos:settings:v1';

  const DEFAULTS = {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    starDensity: 'high', // low | medium | high
    showLabels: true,
    showOrbits: true,
    performanceMode: false,
    soundOn: false,
    animationIntensity: 'normal', // minimal | normal | rich
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      const parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULTS, parsed);
    } catch (err) {
      return Object.assign({}, DEFAULTS);
    }
  }

  let state = load();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* localStorage unavailable (private mode, etc.) — settings simply won't persist */
    }
  }

  function get() {
    return Object.assign({}, state);
  }

  function set(patch) {
    state = Object.assign({}, state, patch);
    save();
    window.dispatchEvent(new CustomEvent('cosmos:settings-changed', { detail: get() }));
    return get();
  }

  function reset() {
    state = Object.assign({}, DEFAULTS);
    save();
    window.dispatchEvent(new CustomEvent('cosmos:settings-changed', { detail: get() }));
    return get();
  }

  window.COSMOS = window.COSMOS || {};
  window.COSMOS.settings = { get, set, reset, DEFAULTS };
})();

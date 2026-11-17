/**
 * Detects WebGL support as early as possible (before any Three.js module is
 * fetched) so pages can show a graceful, fully-functional fallback instead
 * of a blank canvas or a console error. Sets a class on <html> and exposes
 * window.COSMOS.hasWebGL for other scripts to check.
 */
(function () {
  'use strict';

  function detectWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return false;
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      return true;
    } catch (err) {
      return false;
    }
  }

  const hasWebGL = detectWebGL();
  window.COSMOS = window.COSMOS || {};
  window.COSMOS.hasWebGL = hasWebGL;
  document.documentElement.classList.add(hasWebGL ? 'webgl-ok' : 'webgl-unavailable');
})();

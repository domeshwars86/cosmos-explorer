/**
 * Hidden developer overlay: FPS, viewport, pixel ratio, and WebGL renderer
 * string. Only appears with `?debug=true` in the URL — invisible to normal
 * visitors, and never sent anywhere (MASTER PROMPT §40).
 */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== 'true') return;

  const el = document.createElement('div');
  el.id = 'debug-overlay';
  document.body.appendChild(el);

  function rendererInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 'no WebGL';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    } catch (err) {
      return 'unknown';
    }
  }

  const renderer = String(rendererInfo()).slice(0, 42);
  let frames = 0, lastTime = performance.now(), fps = 0;

  function loop(now) {
    frames++;
    if (now - lastTime >= 500) {
      fps = Math.round((frames * 1000) / (now - lastTime));
      frames = 0; lastTime = now;
      render();
    }
    requestAnimationFrame(loop);
  }

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3).toFixed(2);
    el.textContent = [
      `FPS        ${fps}`,
      `Viewport   ${window.innerWidth}×${window.innerHeight}`,
      `Pixel DPR  ${dpr}`,
      `WebGL      ${window.COSMOS?.hasWebGL ? 'available' : 'unavailable'}`,
      `Renderer   ${renderer}`,
      `Reduced FX ${window.COSMOS?.settings?.get()?.reducedMotion ? 'on' : 'off'}`,
    ].join('\n');
  }

  render();
  requestAnimationFrame(loop);
})();

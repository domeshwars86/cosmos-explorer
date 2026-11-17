/**
 * One-time cinematic intro sequence for first-time visitors to the
 * homepage: a black screen, stars fading in, then the COSMOS mark and
 * tagline — after which the page's own hero (Sun + orbiting planets)
 * is already waiting underneath, continuing the same visual story.
 * Skippable, remembered in localStorage (not shown again), and skipped
 * entirely under prefers-reduced-motion (MASTER PROMPT §2).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cosmos:intro-seen';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (localStorage.getItem(STORAGE_KEY) === '1' || reduced) {
    return; // let the normal loading screen (main.js) handle this visit
  }

  // The intro fully replaces the generic loading screen's role on this
  // one-time first visit — remove it so the two don't stack.
  document.getElementById('loading-screen')?.remove();
  try { sessionStorage.setItem('cosmos:loaded-once', '1'); } catch (err) { /* ignore */ }

  const screen = document.createElement('div');
  screen.id = 'intro-screen';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-label', 'COSMOS intro sequence');

  const starsHtml = Array.from({ length: 60 }).map(() => {
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const delay = (Math.random() * 1.8).toFixed(2);
    const size = (Math.random() * 1.6 + 0.6).toFixed(1);
    return `<span class="intro-star" style="left:${x}%; top:${y}%; width:${size}px; height:${size}px; animation-delay:${delay}s;"></span>`;
  }).join('');

  screen.innerHTML = `
    <div class="intro-stars" aria-hidden="true">${starsHtml}</div>
    <div class="intro-logo">
      <div class="brand-mark" aria-hidden="true"></div>
      <h1>COSMOS</h1>
    </div>
    <div class="intro-tagline">EXPLORE THE UNIVERSE</div>
    <button type="button" class="btn btn-outline btn-sm intro-skip" id="intro-skip">Skip Intro</button>
  `;
  document.body.prepend(screen);

  function finish() {
    if (screen.classList.contains('hidden')) return;
    screen.classList.add('hidden');
    localStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => screen.remove(), 1200);
  }

  document.getElementById('intro-skip').addEventListener('click', finish);
  const autoTimer = setTimeout(finish, 4400);
  screen.addEventListener('click', (e) => {
    // Clicking anywhere skips too, except the skip button itself (handled above).
    if (e.target.id !== 'intro-skip') { clearTimeout(autoTimer); finish(); }
  });
})();

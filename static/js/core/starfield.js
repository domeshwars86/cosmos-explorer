/**
 * Lightweight 2D canvas starfield used as the site-wide background.
 * Runs on a plain <canvas> (not WebGL) so it is cheap enough to keep
 * active behind every page, including ones that also run a Three.js scene.
 * Respects prefers-reduced-motion, pauses when the tab is hidden, and
 * reduces star count automatically on small / low-power screens.
 */
(function () {
  'use strict';

  function initStarfield() {
    const canvas = document.getElementById('star-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    const prefersReduced = window.matchMedia('(prefers-reduce-motion: reduce)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const settings = window.COSMOS && window.COSMOS.settings ? window.COSMOS.settings.get() : {};
    let density = settings.starDensity || 'high';

    let stars = [];
    let shootingStars = [];
    let w, h, dpr;
    let running = true;
    let lastTime = 0;

    function densityCount() {
      const area = window.innerWidth * window.innerHeight;
      const factor = density === 'low' ? 0.00006 : density === 'medium' ? 0.00011 : 0.00016;
      const base = Math.round(area * factor);
      return Math.min(base, density === 'low' ? 220 : density === 'medium' ? 420 : 700);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function buildStars() {
      const count = densityCount();
      stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.25,
        twinkleSpeed: Math.random() * 0.0015 + 0.0004,
        phase: Math.random() * Math.PI * 2,
        parallax: Math.random() * 0.4 + 0.05,
      }));
    }

    function maybeSpawnShootingStar(t) {
      if (prefersReduced) return;
      if (Math.random() < 0.0035 && shootingStars.length < 2) {
        const startX = Math.random() * w * 0.6 + w * 0.2;
        shootingStars.push({
          x: startX, y: -20,
          vx: (Math.random() * 0.5 + 0.6) * 5,
          vy: (Math.random() * 0.5 + 0.6) * 3.2,
          life: 0, maxLife: 60 + Math.random() * 30,
        });
      }
    }

    let scrollY = 0;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

    function draw(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const alpha = prefersReduced ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * 0.25;
        const py = (s.y + scrollY * s.parallax * 0.06) % h;
        ctx.beginPath();
        ctx.fillStyle = `rgba(233, 236, 247, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.arc(s.x, py < 0 ? py + h : py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      maybeSpawnShootingStar(t);
      shootingStars = shootingStars.filter((s) => s.life < s.maxLife);
      for (const s of shootingStars) {
        s.x += s.vx; s.y += s.vy; s.life++;
        const alpha = 1 - s.life / s.maxLife;
        ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(draw);
    });

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('cosmos:settings-changed', (e) => {
      if (e.detail && e.detail.starDensity) {
        density = e.detail.starDensity;
        buildStars();
      }
    });

    resize();
    requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStarfield);
  } else {
    initStarfield();
  }
})();

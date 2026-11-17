/**
 * India in Space — loads recent ISRO-tagged news from COSMOS's own news
 * API (server-side filtered by the ISRO category/search term).
 */
import { renderNewsCard, renderEmptyState, attachImageFallback } from '../core/news-render.js';

async function init() {
  const grid = document.getElementById('isro-news-grid');
  attachImageFallback(grid);
  try {
    const res = await fetch('/api/news?category=ISRO&limit=6');
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error();
    if (body.data.items.length === 0) {
      grid.innerHTML = '';
      grid.appendChild(renderEmptyState(() => { window.location.href = '/space?search=ISRO'; }));
      return;
    }
    grid.innerHTML = body.data.items.map(renderNewsCard).join('');
  } catch (err) {
    grid.innerHTML = `<div class="news-empty"><h3>NEWS DATA TEMPORARILY UNAVAILABLE</h3></div>`;
  }
}

init();

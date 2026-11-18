/**
 * Shared rendering helpers for space news cards — used by the Space
 * Intelligence hub, the India in Space page, and anywhere else a news
 * grid appears, so the card markup only exists in one place.
 */

import { escapeHtml, safeHttpUrl, formatISTDate } from './format.js';

const CATEGORY_ICONS = {
  ISRO: '🇮🇳', NASA: '🚀', ESA: '🛰️', SpaceX: '🚀', Mars: '🔴', Moon: '🌙',
  Telescopes: '🔭', 'Human Spaceflight': '👨‍🚀', 'Asteroids & Comets': '☄️',
  'Deep Space': '✨', Planets: '🪐', Launches: '🛫', Missions: '📡', Science: '🔬',
};

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatISTDate(iso);
}

export function renderNewsCard(a) {
  const icon = CATEGORY_ICONS[a.category] || '🛰️';
  const imageUrl = safeHttpUrl(a.image_url);
  const articleId = String(a.id ?? '');
  const image = imageUrl
    ? `<img class="news-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" data-fallback-icon="${icon}" data-fallback-category="${escapeHtml(a.category)}" />`
    : `<div class="news-image fallback">${icon} ${escapeHtml(a.category)}</div>`;

  return `
    <a class="news-card" href="/space/news/${encodeURIComponent(articleId)}" data-article-id="${escapeHtml(articleId)}">
      ${image}
      <div class="news-card-body">
        <div class="news-card-meta"><span class="badge" style="padding:0.15rem 0.5rem;">${escapeHtml(a.category)}</span><span class="text-muted">${timeAgo(a.published_at)}</span></div>
        <div class="news-card-title">${escapeHtml(a.title)}</div>
        <div class="news-card-summary">${escapeHtml((a.summary || '').slice(0, 140))}${a.summary && a.summary.length > 140 ? '…' : ''}</div>
        <div class="news-card-footer">
          <span class="news-source-badge">${escapeHtml(a.source)}</span>
          <span class="text-accent">Read Story →</span>
        </div>
      </div>
    </a>`;
}

/**
 * Swaps a broken thumbnail image for the category fallback tile. Attach
 * once per container (news grid) rather than inline per-image — `error`
 * events don't bubble, so this listens on the capture phase instead of
 * relying on an inline `onerror` attribute string.
 */
export function attachImageFallback(container) {
  container.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains('news-image')) return;
    const fallback = document.createElement('div');
    fallback.className = 'news-image fallback';
    fallback.textContent = `${img.dataset.fallbackIcon || '🛰️'} ${img.dataset.fallbackCategory || ''}`;
    img.replaceWith(fallback);
  }, true);
}

export function renderSkeletons(n) {
  return new Array(n).fill('<div class="news-skeleton"><div class="sk-image"></div><div class="sk-line"></div><div class="sk-line"></div></div>').join('');
}

export function renderEmptyState(onClear) {
  const el = document.createElement('div');
  el.className = 'news-empty';
  el.innerHTML = `
    <h3>NO SIGNAL</h3>
    <p class="text-secondary" style="margin-top:0.6rem;">No stories matched your current filters.</p>
    <button type="button" class="btn btn-outline btn-sm" style="margin-top:1.2rem;" id="news-clear-filters">Clear Filters</button>
  `;
  el.querySelector('#news-clear-filters').addEventListener('click', onClear);
  return el;
}

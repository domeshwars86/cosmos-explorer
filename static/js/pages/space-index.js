/**
 * Space Intelligence hub — fetches everything from COSMOS's own
 * /api/news* and /api/space/* endpoints (never SNAPI directly), renders
 * the stat dashboard, category/source filters, search, and a paginated
 * news grid, plus the "What Changed?" welcome-back banner.
 */
import { renderNewsCard, renderSkeletons, renderEmptyState, attachImageFallback } from '../core/news-render.js';
import { escapeHtml, formatISTTime } from '../core/format.js';

const state = { page: 1, category: '', source: '', search: '' };

async function fetchJSON(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.ok) throw new Error(body.error || 'Request failed');
  return body.data;
}

async function loadStats() {
  try {
    const stats = await fetchJSON('/api/space/stats');
    document.getElementById('stat-news').textContent = stats.news_count;
    document.getElementById('stat-missions').textContent = stats.mission_updates;
    document.getElementById('stat-isro').textContent = stats.isro_updates;
    document.getElementById('stat-launches').textContent = stats.upcoming_launches;
    document.getElementById('stat-agencies').textContent = stats.agencies;
  } catch (err) { /* stats are non-critical — leave the "—" placeholders */ }
}

async function loadCategories() {
  const container = document.getElementById('category-chips');
  try {
    const categories = await fetchJSON('/api/news/categories');
    const all = ['All', ...categories];
    container.innerHTML = all.map((c) => `<button type="button" class="category-chip ${c === 'All' ? 'active' : ''}" data-category="${c === 'All' ? '' : escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    container.querySelectorAll('.category-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.category-chip').forEach((b) => b.classList.toggle('active', b === btn));
        state.category = btn.dataset.category;
        state.page = 1;
        loadNews(true);
      });
    });
  } catch (err) { /* leave empty — filters are optional */ }
}

async function loadSourceChip() {
  const container = document.getElementById('source-chips');
  container.replaceChildren();
  if (!state.source) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'category-chip active';
  button.id = 'clear-source';
  button.textContent = `Source: ${state.source} ✕`;
  container.appendChild(button);
  button.addEventListener('click', () => {
    state.source = '';
    loadSourceChip();
    loadNews(true);
  });
}

function renderLastUpdated(iso) {
  const el = document.getElementById('last-updated');
  if (!iso) { el.textContent = ''; return; }
  const d = new Date(iso * 1000);
  el.textContent = `LAST UPDATED ${formatISTTime(d)}`;
}

async function loadNews(reset) {
  const grid = document.getElementById('news-grid');
  const loadMoreBtn = document.getElementById('load-more');
  if (reset) grid.innerHTML = renderSkeletons(6);

  const params = new URLSearchParams({
    page: state.page, limit: 12, category: state.category, source: state.source, search: state.search,
  });

  try {
    const data = await fetchJSON(`/api/news?${params}`);
    renderLastUpdated(data.last_refreshed);
    if (reset) grid.innerHTML = '';
    if (data.items.length === 0 && state.page === 1) {
      grid.innerHTML = '';
      grid.appendChild(renderEmptyState(clearFilters));
      loadMoreBtn.classList.add('hidden');
      return;
    }
    grid.insertAdjacentHTML('beforeend', data.items.map(renderNewsCard).join(''));
    loadMoreBtn.classList.toggle('hidden', !data.has_more);

    if (reset && state.page === 1 && !state.category && !state.source && !state.search) {
      checkWhatsChanged(data.items);
    }
  } catch (err) {
    grid.innerHTML = `<div class="news-empty"><h3>NEWS DATA TEMPORARILY UNAVAILABLE</h3><p class="text-secondary" style="margin-top:0.6rem;">The space news service could not be reached. Please try again shortly.</p></div>`;
    loadMoreBtn.classList.add('hidden');
  }
}

function checkWhatsChanged(latestItems) {
  const changed = window.COSMOS?.newsTracker?.computeWhatsChanged(latestItems);
  const banner = document.getElementById('whats-changed');
  if (changed) {
    banner.classList.remove('hidden');
    banner.innerHTML = `
      <span style="font-size:1.4rem;">✦</span>
      <div>
        <div class="eyebrow">Welcome Back</div>
        <div style="margin-top:0.2rem;">${changed.newCount} new space stor${changed.newCount === 1 ? 'y' : 'ies'}${changed.missionCount ? ` · ${changed.missionCount} mission updates` : ''}${changed.isroCount ? ` · ${changed.isroCount} India updates` : ''}</div>
      </div>`;
  }
  window.COSMOS?.newsTracker?.markVisitNow();
}

function clearFilters() {
  state.category = ''; state.source = ''; state.search = ''; state.page = 1;
  document.getElementById('news-search').value = '';
  document.querySelectorAll('.category-chip').forEach((b) => b.classList.toggle('active', !b.dataset.category));
  loadSourceChip();
  loadNews(true);
}

function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('source')) state.source = params.get('source');

  attachImageFallback(document.getElementById('news-grid'));
  loadStats();
  loadCategories();
  loadSourceChip();
  loadNews(true);

  let debounce;
  document.getElementById('news-search').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadNews(true);
    }, 350);
  });

  document.getElementById('load-more').addEventListener('click', () => {
    state.page++;
    loadNews(false);
  });

  document.getElementById('refresh-news').addEventListener('click', () => {
    state.page = 1;
    loadNews(true);
    loadStats();
  });
}

init();

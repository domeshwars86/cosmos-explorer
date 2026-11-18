/**
 * Space Intelligence hub — fetches everything from COSMOS's own
 * /api/news* and /api/space/* endpoints (never SNAPI directly), renders
 * the stat dashboard, category/source filters, search, and a paginated
 * news grid, personal topic follows, plus the "What Changed?" welcome-back banner.
 */
import { renderNewsCard, renderSkeletons, renderEmptyState, attachImageFallback } from '../core/news-render.js';
import { escapeHtml, formatISTTime } from '../core/format.js';

const state = { page: 1, category: '', source: '', search: '', followingOnly: false, followedItems: null, followedLastUpdated: null };

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
        state.followedItems = null;
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
    state.followedItems = null;
    loadSourceChip();
    loadNews(true);
  });
}

function updateFollowedTopics() {
  const topics = window.COSMOS?.newsTracker?.getFollowedTopics() || [];
  const allButton = document.getElementById('news-view-all');
  const followingButton = document.getElementById('news-view-following');
  const count = document.getElementById('followed-topic-count');
  const help = document.getElementById('followed-topic-help');
  const list = document.getElementById('followed-topics');

  allButton.classList.toggle('active', !state.followingOnly);
  allButton.setAttribute('aria-pressed', String(!state.followingOnly));
  followingButton.classList.toggle('active', state.followingOnly);
  followingButton.setAttribute('aria-pressed', String(state.followingOnly));
  count.textContent = String(topics.length);
  help.textContent = topics.length
    ? 'Your followed topics are saved in this browser only.'
    : 'Follow a topic using the buttons on any story card.';
  list.innerHTML = topics.map((topic) => `
    <button type="button" class="space-followed-topic" data-unfollow-topic="${escapeHtml(topic)}" aria-label="Unfollow ${escapeHtml(topic)}">
      <span>${escapeHtml(topic)}</span><span aria-hidden="true">×</span>
    </button>`).join('');
}

function updateCardFollowButtons(topic, isFollowing) {
  document.querySelectorAll('#news-grid [data-follow-topic]').forEach((button) => {
    if (button.dataset.followTopic !== topic) return;
    const action = isFollowing ? 'Unfollow' : 'Follow';
    button.classList.toggle('is-following', isFollowing);
    button.setAttribute('aria-pressed', String(isFollowing));
    button.setAttribute('aria-label', `${action} ${topic}`);
    button.querySelector('.news-follow-state').textContent = isFollowing ? 'Following' : 'Follow';
  });
}

function setFollowingMode(enabled) {
  state.followingOnly = enabled;
  state.page = 1;
  state.followedItems = null;
  updateFollowedTopics();
  loadNews(true);
}

function toggleTopic(topic) {
  const tracker = window.COSMOS?.newsTracker;
  if (!tracker || !topic) return;
  const isFollowing = tracker.toggleFollow(topic);
  state.followedItems = null;
  updateCardFollowButtons(topic, isFollowing);
  updateFollowedTopics();
  if (state.followingOnly) {
    state.page = 1;
    loadNews(true);
  }
}

async function fetchFollowedNews() {
  const topics = window.COSMOS?.newsTracker?.getFollowedTopics() || [];
  if (topics.length === 0) return { items: [], has_more: false, last_refreshed: null };

  if (state.followedItems === null) {
    const params = new URLSearchParams({ page: 1, limit: 50, category: state.category, source: state.source, search: state.search });
    const firstPage = await fetchJSON(`/api/news?${params}`);
    const pool = [...firstPage.items];
    if (firstPage.has_more) {
      params.set('page', '2');
      const secondPage = await fetchJSON(`/api/news?${params}`);
      pool.push(...secondPage.items);
    }
    state.followedItems = pool.filter((article) => Array.isArray(article.tags) && article.tags.some((tag) => topics.includes(tag)));
    state.followedLastUpdated = firstPage.last_refreshed;
  }

  const start = (state.page - 1) * 12;
  return {
    items: state.followedItems.slice(start, start + 12),
    has_more: state.followedItems.length > start + 12,
    last_refreshed: state.followedLastUpdated,
  };
}

function noFollowedTopicsState() {
  const empty = renderEmptyState(() => setFollowingMode(false));
  empty.querySelector('h3').textContent = 'NO TOPICS FOLLOWED YET';
  empty.querySelector('p').textContent = 'Follow a topic using the buttons on story cards. Your choices stay in this browser.';
  empty.querySelector('#news-clear-filters').textContent = 'Show All Stories';
  return empty;
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

  try {
    const params = new URLSearchParams({
      page: state.page, limit: 12, category: state.category, source: state.source, search: state.search,
    });
    const data = state.followingOnly
      ? await fetchFollowedNews()
      : await fetchJSON(`/api/news?${params}`);
    renderLastUpdated(data.last_refreshed);
    if (reset) grid.innerHTML = '';
    if (data.items.length === 0 && state.page === 1) {
      grid.innerHTML = '';
      const noTopicsFollowed = state.followingOnly && (window.COSMOS?.newsTracker?.getFollowedTopics() || []).length === 0;
      grid.appendChild(noTopicsFollowed ? noFollowedTopicsState() : renderEmptyState(clearFilters));
      loadMoreBtn.classList.add('hidden');
      return;
    }
    const followedTopics = window.COSMOS?.newsTracker?.getFollowedTopics() || [];
    grid.insertAdjacentHTML('beforeend', data.items.map((article) => renderNewsCard(article, { showFollow: true, followedTopics })).join(''));
    loadMoreBtn.classList.toggle('hidden', !data.has_more);

    if (reset && state.page === 1 && !state.category && !state.source && !state.search && !state.followingOnly) {
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
  state.followingOnly = false;
  state.followedItems = null;
  document.getElementById('news-search').value = '';
  document.querySelectorAll('#category-chips .category-chip').forEach((b) => b.classList.toggle('active', !b.dataset.category));
  updateFollowedTopics();
  loadSourceChip();
  loadNews(true);
}

function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('source')) state.source = params.get('source');

  attachImageFallback(document.getElementById('news-grid'));
  updateFollowedTopics();
  document.getElementById('news-view-all').addEventListener('click', () => setFollowingMode(false));
  document.getElementById('news-view-following').addEventListener('click', () => setFollowingMode(true));
  document.getElementById('followed-topics').addEventListener('click', (e) => {
    const button = e.target.closest('[data-unfollow-topic]');
    if (button) toggleTopic(button.dataset.unfollowTopic);
  });
  document.getElementById('news-grid').addEventListener('click', (e) => {
    const button = e.target.closest('[data-follow-topic]');
    if (button) {
      e.preventDefault();
      toggleTopic(button.dataset.followTopic);
    }
  });
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
      state.followedItems = null;
      loadNews(true);
    }, 350);
  });

  document.getElementById('load-more').addEventListener('click', () => {
    state.page++;
    loadNews(false);
  });

  document.getElementById('refresh-news').addEventListener('click', () => {
    state.page = 1;
    state.followedItems = null;
    loadNews(true);
    loadStats();
  });
}

init();

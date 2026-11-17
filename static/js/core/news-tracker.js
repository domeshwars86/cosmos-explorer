/**
 * "What changed since your last visit?" + followed topics, both
 * localStorage-only (MASTER PROMPT §28/§29/§30). No account, no server
 * state — this never blocks the news feed itself from working.
 */
(function () {
  'use strict';
  const VISIT_KEY = 'cosmos:news:last-visit';
  const FOLLOW_KEY = 'cosmos:news:following';

  function getLastVisit() {
    const raw = localStorage.getItem(VISIT_KEY);
    return raw ? new Date(raw) : null;
  }

  function markVisitNow() {
    try { localStorage.setItem(VISIT_KEY, new Date().toISOString()); } catch (err) { /* ignore */ }
  }

  function computeWhatsChanged(articles) {
    const lastVisit = getLastVisit();
    if (!lastVisit) return null; // first-ever visit — nothing to compare against
    const fresh = articles.filter((a) => a.published_at && new Date(a.published_at) > lastVisit);
    if (fresh.length === 0) return null;
    return {
      newCount: fresh.length,
      missionCount: fresh.filter((a) => ['Missions', 'Launches'].includes(a.category)).length,
      isroCount: fresh.filter((a) => a.tags.includes('ISRO')).length,
    };
  }

  function getFollowedTopics() {
    try { return JSON.parse(localStorage.getItem(FOLLOW_KEY) || '[]'); } catch (err) { return []; }
  }
  function setFollowedTopics(list) {
    try { localStorage.setItem(FOLLOW_KEY, JSON.stringify(list)); } catch (err) { /* ignore */ }
  }
  function isFollowing(topic) {
    return getFollowedTopics().includes(topic);
  }
  function toggleFollow(topic) {
    const list = getFollowedTopics();
    const idx = list.indexOf(topic);
    if (idx === -1) list.push(topic); else list.splice(idx, 1);
    setFollowedTopics(list);
    return list.includes(topic);
  }

  window.COSMOS = window.COSMOS || {};
  window.COSMOS.newsTracker = { getLastVisit, markVisitNow, computeWhatsChanged, getFollowedTopics, setFollowedTopics, isFollowing, toggleFollow };
})();

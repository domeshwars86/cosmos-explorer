/**
 * My COSMOS Journal — lets a visitor save any object they're viewing to a
 * personal, localStorage-only list with an editable note. Exposed as
 * window.COSMOS.journal so any page script can call `.save(entry)`.
 */
(function () {
  'use strict';
  const KEY = 'cosmos:journal:v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (err) { return []; }
  }
  function persist(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (err) { /* ignore */ }
  }

  function save(entry) {
    const list = load();
    if (list.some((e) => e.url === entry.url)) return false; // already saved
    list.unshift({
      id: `${Date.now()}`,
      name: entry.name,
      url: entry.url,
      why: entry.why || '',
      note: '',
      savedAt: new Date().toISOString(),
    });
    persist(list.slice(0, 100));
    return true;
  }

  function remove(id) {
    persist(load().filter((e) => e.id !== id));
  }

  function updateNote(id, note) {
    const list = load();
    const entry = list.find((e) => e.id === id);
    if (entry) { entry.note = note; persist(list); }
  }

  function isSaved(url) {
    return load().some((e) => e.url === url);
  }

  window.COSMOS = window.COSMOS || {};
  window.COSMOS.journal = { save, remove, updateNote, isSaved, all: load };
})();

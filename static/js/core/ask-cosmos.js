/**
 * "Ask COSMOS" — a lightweight natural-language-style query box over the
 * site's own dataset (see app/services/assistant_service.py). Explicitly
 * labeled as a deterministic knowledge engine, not a live AI model
 * (MASTER PROMPT §52/§53).
 */
(function () {
  'use strict';

  const DEFAULT_SUGGESTIONS = [
    'Which planet is hottest?',
    'Which planet has the most moons?',
    'How long is a year on Mars?',
    'Does Saturn have rings?',
  ];

  function renderSuggestions(list) {
    const el = document.getElementById('ask-suggestions');
    if (!el) return;
    el.innerHTML = list.map((q) => `<button type="button" data-q="${q.replace(/"/g, '&quot;')}">${q}</button>`).join('');
    el.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      document.getElementById('ask-input').value = btn.dataset.q;
      ask(btn.dataset.q);
    }));
  }

  async function ask(question) {
    const answerBox = document.getElementById('ask-answer');
    const qEl = document.getElementById('ask-answer-q');
    const aEl = document.getElementById('ask-answer-a');
    const linkEl = document.getElementById('ask-answer-link');
    if (!question || !question.trim()) return;

    qEl.textContent = `"${question.trim()}"`;
    aEl.textContent = 'Thinking…';
    answerBox.classList.add('visible');
    linkEl.classList.add('hidden');

    try {
      const res = await fetch(`/api/ask?q=${encodeURIComponent(question)}`);
      const body = await res.json();
      const data = body.data || {};
      aEl.textContent = data.answer || 'No answer available.';
      if (data.url) {
        linkEl.href = data.url;
        linkEl.textContent = `Open ${data.subject || 'profile'} →`;
        linkEl.classList.remove('hidden');
      }
      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        renderSuggestions(data.suggestions);
      }
    } catch (err) {
      aEl.textContent = 'Unable to reach the knowledge engine right now.';
    }
  }

  function open() {
    const overlay = document.getElementById('ask-cosmos-overlay');
    const backdrop = document.getElementById('overlay-backdrop');
    if (!overlay) return;
    document.getElementById('search-overlay')?.classList.remove('open');
    overlay.classList.add('open');
    backdrop?.classList.add('open');
    renderSuggestions(DEFAULT_SUGGESTIONS);
    setTimeout(() => document.getElementById('ask-input')?.focus(), 60);
  }

  function close() {
    const overlay = document.getElementById('ask-cosmos-overlay');
    const backdrop = document.getElementById('overlay-backdrop');
    overlay?.classList.remove('open');
    if (!document.getElementById('settings-panel')?.classList.contains('open') && !document.getElementById('search-overlay')?.classList.contains('open')) {
      backdrop?.classList.remove('open');
    }
  }

  function init() {
    document.getElementById('open-ask-cosmos')?.addEventListener('click', open);
    const overlay = document.getElementById('ask-cosmos-overlay');
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.getElementById('ask-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      ask(document.getElementById('ask-input').value);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

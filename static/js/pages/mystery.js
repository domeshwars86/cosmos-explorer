/**
 * Identify the Object — a short, restrained discovery challenge built on
 * real planetary data (app/services/mystery_service.py). Not a scored
 * arcade game; just clues, a guess, and an explanation.
 */
let difficulty = 'medium';
let current = null;

async function loadMystery() {
  const res = await fetch(`/api/mystery?difficulty=${difficulty}`);
  const body = await res.json();
  current = body.data;
  render();
}

function render() {
  const cluesEl = document.getElementById('mystery-clues');
  const optionsEl = document.getElementById('mystery-options');
  const resultEl = document.getElementById('mystery-result');
  resultEl.classList.add('hidden');
  resultEl.innerHTML = '';

  cluesEl.innerHTML = current.clues.map((c) => `
    <div class="stat-card in-view"><div class="stat-label">${c.label}</div><div class="stat-value" style="font-size:1.05rem;">${c.value}</div></div>
  `).join('');

  optionsEl.innerHTML = current.options.map((o) => `
    <button type="button" class="btn btn-outline" data-id="${o.id}" style="justify-content:flex-start;">${o.name}</button>
  `).join('');

  optionsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => guess(btn.dataset.id, btn));
  });
}

function guess(id, btn) {
  document.querySelectorAll('#mystery-options button').forEach((b) => { b.disabled = true; });
  const correct = id === current.answer_id;
  btn.style.borderColor = correct ? 'var(--success)' : 'var(--danger)';
  const resultEl = document.getElementById('mystery-result');
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <span class="fact-kicker" style="color:${correct ? 'var(--success)' : 'var(--danger)'};">${correct ? 'CORRECT' : `NOT QUITE — it was ${current.answer_name}`}</span>
    <p>${current.explanation}</p>
    <a href="${current.url}" class="btn btn-sm btn-outline" style="margin-top:0.8rem;">Open ${current.answer_name}'s Profile</a>
  `;
  window.COSMOS?.blip?.(correct ? 880 : 260, 0.1);
}

function init() {
  document.querySelectorAll('#mystery-difficulty button').forEach((btn) => {
    btn.addEventListener('click', () => {
      difficulty = btn.dataset.difficulty;
      document.querySelectorAll('#mystery-difficulty button').forEach((b) => b.classList.toggle('active', b === btn));
      loadMystery();
    });
  });
  document.getElementById('mystery-new').addEventListener('click', loadMystery);
  loadMystery();
}

init();

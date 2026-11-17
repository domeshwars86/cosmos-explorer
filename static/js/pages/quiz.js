/**
 * COSMOS Challenge — a short quiz over the site's own dataset
 * (app/data/quiz.json). Score and streak are session-local state, not
 * saved anywhere — deliberately restrained, not gamified (MASTER PROMPT
 * "keep the UI elegant, not childish").
 */
let questions = [];
let index = 0;
let score = 0;
let streak = 0;
let category = 'all';
let answered = false;

async function loadRound() {
  const res = await fetch(`/api/quiz?category=${category}&limit=10`);
  const body = await res.json();
  questions = body.data.questions;
  index = 0;
  document.getElementById('quiz-total').textContent = questions.length;
  document.getElementById('quiz-final').classList.add('hidden');
  document.getElementById('quiz-panel').classList.remove('hidden');
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  const q = questions[index];
  document.getElementById('quiz-index').textContent = index + 1;
  document.getElementById('quiz-question').textContent = q.question;
  document.getElementById('quiz-explain').classList.add('hidden');
  document.getElementById('quiz-next').classList.add('hidden');

  const optionsEl = document.getElementById('quiz-options');
  optionsEl.innerHTML = q.options.map((opt, i) => `<button type="button" class="btn btn-outline" data-i="${i}" style="justify-content:flex-start;">${opt}</button>`).join('');
  optionsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.i, 10), btn));
  });
}

function selectAnswer(i, btn) {
  if (answered) return;
  answered = true;
  const q = questions[index];
  const correct = i === q.answer;

  document.querySelectorAll('#quiz-options button').forEach((b, idx) => {
    b.disabled = true;
    if (idx === q.answer) b.style.borderColor = 'var(--success)';
  });
  if (!correct) btn.style.borderColor = 'var(--danger)';

  if (correct) { score++; streak++; } else { streak = 0; }
  document.getElementById('quiz-score').textContent = score;
  document.getElementById('quiz-streak').textContent = streak;

  const explainEl = document.getElementById('quiz-explain');
  explainEl.classList.remove('hidden');
  explainEl.innerHTML = `<span class="fact-kicker" style="color:${correct ? 'var(--success)' : 'var(--danger)'};">${correct ? 'CORRECT' : 'NOT QUITE'}</span><p>${q.explanation}</p>`;
  document.getElementById('quiz-next').classList.remove('hidden');
  window.COSMOS?.blip?.(correct ? 880 : 260, 0.1);
}

function nextQuestion() {
  index++;
  if (index >= questions.length) {
    finishRound();
  } else {
    renderQuestion();
  }
}

function finishRound() {
  document.getElementById('quiz-panel').classList.add('hidden');
  const finalEl = document.getElementById('quiz-final');
  finalEl.classList.remove('hidden');
  document.getElementById('quiz-final-score').textContent = `${score} / ${questions.length} correct`;
}

function init() {
  document.querySelectorAll('#quiz-category button').forEach((btn) => {
    btn.addEventListener('click', () => {
      category = btn.dataset.category;
      document.querySelectorAll('#quiz-category button').forEach((b) => b.classList.toggle('active', b === btn));
      score = 0; streak = 0;
      document.getElementById('quiz-score').textContent = 0;
      document.getElementById('quiz-streak').textContent = 0;
      loadRound();
    });
  });
  document.getElementById('quiz-next').addEventListener('click', nextQuestion);
  document.getElementById('quiz-restart').addEventListener('click', () => { score = 0; streak = 0; loadRound(); });
  loadRound();
}

init();

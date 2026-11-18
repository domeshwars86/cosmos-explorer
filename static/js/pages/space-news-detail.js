/**
 * Article detail page — never reproduces the full article (MASTER PROMPT
 * §17/§46): shows title, source, short summary, tags, and a prominent
 * "Read Full Story at Source" link, plus the related-COSMOS-object panel
 * that connects real-world news back into the interactive site.
 */
import { timeAgo } from '../core/news-render.js';
import { escapeHtml, formatISTDateTime, safeHttpUrl } from '../core/format.js';

async function init() {
  const root = document.getElementById('article-root');
  const id = window.__ARTICLE_ID__;
  try {
    const res = await fetch(`/api/news/${encodeURIComponent(id)}`);
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || 'Unavailable');
    render(body.data, root);
  } catch (err) {
    root.innerHTML = `<div class="news-empty"><h3>STORY UNAVAILABLE</h3><p class="text-secondary" style="margin-top:0.6rem;">This story could not be loaded right now. <a href="/space">Return to Space Intelligence</a>.</p></div>`;
  }
}

function render(a, root) {
  document.title = `${a.title} — COSMOS`;
  const imageUrl = safeHttpUrl(a.image_url);
  const sourceUrl = safeHttpUrl(a.source_url);

  const relatedHtml = a.related_cosmos.length ? `
    <div class="panel reveal in-view" style="padding:1.6rem 1.8rem; margin-top:1.5rem;">
      <span class="eyebrow">Related COSMOS Object${a.related_cosmos.length > 1 ? 's' : ''}</span>
      <div class="row wrap gap-sm" style="margin-top:0.9rem;">
        ${a.related_cosmos.map((r) => `<a href="${r.url}" class="btn btn-outline btn-sm">Explore ${escapeHtml(r.label)} →</a>`).join('')}
      </div>
    </div>` : '';

  const suggestionsHtml = a.related_suggestions.length ? `
    <div class="panel reveal in-view" style="padding:1.6rem 1.8rem; margin-top:1rem;">
      <span class="eyebrow">You May Also Like</span>
      <div class="row wrap gap-sm" style="margin-top:0.9rem;">
        ${a.related_suggestions.map((r) => `<a href="${r.url}" class="btn btn-ghost btn-sm">${escapeHtml(r.label)} →</a>`).join('')}
      </div>
    </div>` : '';

  root.innerHTML = `
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" style="width:100%; border-radius:var(--radius-lg); aspect-ratio:16/9; object-fit:cover;" />` : ''}
    <div style="margin-top:1.5rem;">
      <span class="badge">${escapeHtml(a.category)}</span>
      <h1 style="margin-top:0.8rem; font-size:clamp(1.5rem,3vw,2.2rem);">${escapeHtml(a.title)}</h1>
      <div class="row gap-md wrap" style="margin-top:0.8rem; font-size:0.85rem; color:var(--text-secondary);">
        <span>SOURCE: <strong class="text-accent">${escapeHtml(a.source)}</strong></span>
        <span>${timeAgo(a.published_at)}</span>
        <span>${a.published_at ? formatISTDateTime(a.published_at) : ''}</span>
      </div>
    </div>
    ${a.summary ? `<p class="text-lead" style="margin-top:1.5rem;">${escapeHtml(a.summary)}</p>` : ''}
    <div class="row wrap gap-sm" style="margin-top:1.2rem;">${a.tags.map((t) => `<span class="news-tag">${escapeHtml(t)}</span>`).join('')}</div>
    ${sourceUrl ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top:1.8rem;">Read Full Story at ${escapeHtml(a.source)} →</a>` : ''}
    <p class="text-muted" style="font-size:0.76rem; margin-top:0.8rem;">COSMOS aggregates and links to space news — it is not the original publisher of this story.</p>
    ${relatedHtml}
    ${suggestionsHtml}
  `;
}

init();

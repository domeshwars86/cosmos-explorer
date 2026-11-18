import assert from 'node:assert/strict';
import test from 'node:test';

import { escapeHtml, formatISTDateTime, formatISTTime, safeHttpUrl } from '../../static/js/core/format.js';
import { renderLaunchCard } from '../../static/js/core/launch-render.js';
import { renderNewsCard } from '../../static/js/core/news-render.js';

test('IST formatters render UTC instants in India Standard Time', () => {
  assert.equal(formatISTDateTime('2026-11-18T00:00:00Z'), '18 Nov 2026, 5:30 am IST');
  assert.equal(formatISTTime('2026-11-18T00:00:00Z'), '05:30 IST');
  assert.equal(formatISTDateTime('not a date'), '');
});

test('HTML and URL helpers neutralize unsafe content', () => {
  assert.equal(escapeHtml(`<script title="x">it's & fun</script>`), '&lt;script title=&quot;x&quot;&gt;it&#39;s &amp; fun&lt;/script&gt;');
  assert.equal(safeHttpUrl('javascript:alert(1)'), '');
  assert.equal(safeHttpUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeHttpUrl('https://example.com/story'), 'https://example.com/story');
});

test('news cards escape API text, encode IDs, and reject unsafe image URLs', () => {
  const html = renderNewsCard({
    id: '1"><script>alert(1)</script>',
    category: 'Science',
    title: '<img src=x onerror=alert(1)>',
    summary: 'Safe summary',
    source: 'Example',
    image_url: 'javascript:alert(1)',
    published_at: '2026-11-18T00:00:00Z',
  });
  assert.ok(html.includes('href="/space/news/1%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E"'));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /src="javascript:/);
  assert.doesNotMatch(html, /<script>/);
});

test('launch cards escape feed fields, constrain status classes, and reject unsafe source links', () => {
  const html = renderLaunchCard({
    name: '<img src=x onerror=alert(1)>',
    agency: 'Agency',
    rocket: 'Rocket',
    status: 'GO"><script>alert(1)</script>',
    net: '2026-11-18T00:00:00Z',
    time_is_precise: true,
    location: 'Launch site',
    mission_type: 'Science',
    orbit: 'LEO',
    description: 'Description',
    source: 'Provider',
    source_url: 'javascript:alert(1)',
  });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /18 Nov 2026, 5:30 am IST/);
  assert.doesNotMatch(html, /launch-status-badge GO/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /href="javascript:/);
});

import { formatRange } from '../../content/format.js';

/**
 * Readable timeline of every experience entry, newest first (the loader sorts).
 * `focus(id)` scrolls to and highlights one entry, used when arriving from a board sheet.
 */
export function createExperiencePage(experience) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'experience-page';

  const header = document.createElement('header');
  header.className = 'experience-header';
  header.setAttribute('data-reveal', '');
  header.innerHTML = `
    <p class="experience-kicker">Work log</p>
    <h1 class="page-heading">Experience</h1>`;
  el.appendChild(header);

  const list = document.createElement('ol');
  list.className = 'timeline';
  for (const entry of experience) {
    const item = document.createElement('li');
    item.className = 'timeline-entry';
    item.dataset.entry = entry.id;
    item.setAttribute('data-reveal', '');
    item.innerHTML = `
      <p class="timeline-dates">${formatRange(entry)}</p>
      <article class="timeline-card">
        <h2 class="timeline-org">${entry.org}</h2>
        <p class="timeline-role">${entry.title}</p>
        <p class="timeline-text">${entry.body}</p>
        <ul class="timeline-tags">${(entry.tags ?? []).map((t) => `<li>${t}</li>`).join('')}</ul>
      </article>`;
    list.appendChild(item);
  }
  el.appendChild(list);

  function focus(id) {
    for (const item of list.children) item.classList.toggle('is-focus', item.dataset.entry === id);
    const target = id && list.querySelector(`[data-entry="${id}"]`);
    if (target) target.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    else el.closest('.overlay-page')?.scrollTo({ top: 0 });
  }

  return { el, focus };
}

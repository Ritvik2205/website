import gsap from 'gsap';
import { formatRange } from '../content/format.js';

/**
 * DOM chrome for the zoomed corkboard: back pill, a hint/timeline pill, and the
 * glass card for a picked sheet. Navigation decisions stay in main.js.
 */
export function createBoardUi(root, { onBack, onTimeline, onCloseCard }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'board-ui';
  el.hidden = true;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'overlay-back';
  back.innerHTML = '<span aria-hidden="true">←</span> back to desk <kbd>esc</kbd>';
  back.addEventListener('click', onBack);

  const hint = document.createElement('div');
  hint.className = 'board-hint';
  hint.innerHTML = '<span>Pick a pinned sheet</span>';
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'board-hint-action';
  all.textContent = 'Full timeline →';
  all.addEventListener('click', () => onTimeline(null));
  hint.appendChild(all);

  const card = document.createElement('aside');
  card.className = 'board-card';
  card.hidden = true;
  card.setAttribute('aria-labelledby', 'board-card-org');
  card.innerHTML = `
    <button type="button" class="board-card-close" aria-label="Close sheet">×</button>
    <p class="board-card-meta"></p>
    <h2 class="board-card-org" id="board-card-org"></h2>
    <p class="board-card-role"></p>
    <p class="board-card-summary"></p>
    <ul class="board-card-tags"></ul>
    <button type="button" class="board-card-more">Read full entry →</button>`;
  card.querySelector('.board-card-close').addEventListener('click', onCloseCard);
  let cardEntryId = null;
  card.querySelector('.board-card-more').addEventListener('click', () => onTimeline(cardEntryId));

  el.append(back, hint, card);
  root.appendChild(el);

  function fadeIn(targets, from) {
    if (reduced) return;
    gsap.fromTo(targets, { opacity: 0, ...from }, {
      opacity: 1, x: 0, y: 0, duration: 0.55, stagger: 0.05, ease: 'expo.out', clearProps: 'opacity,transform',
    });
  }

  return {
    show() {
      el.hidden = false;
      fadeIn([back, hint], { y: 10 });
    },
    hide() {
      el.hidden = true;
    },
    /** `side` is where the card sits: opposite the sheet so both stay visible. */
    showCard(entry, index, side) {
      cardEntryId = entry.id;
      card.querySelector('.board-card-meta').textContent = `FILE ${String(index + 1).padStart(2, '0')} · ${formatRange(entry)}`;
      card.querySelector('.board-card-org').textContent = entry.org;
      card.querySelector('.board-card-role').textContent = entry.title;
      card.querySelector('.board-card-summary').textContent = entry.summary;
      card.querySelector('.board-card-tags').innerHTML = (entry.tags ?? []).map((t) => `<li>${t}</li>`).join('');
      card.dataset.side = side;
      card.hidden = false;
      hint.hidden = true;
      fadeIn(card, { x: side === 'right' ? 24 : -24 });
      card.querySelector('.board-card-more').focus({ preventScroll: true });
    },
    hideCard() {
      card.hidden = true;
      hint.hidden = false;
      cardEntryId = null;
    },
  };
}

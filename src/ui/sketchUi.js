/**
 * Chrome for the sketchbook focus mode: back pill and a page bar. It reports
 * intents only; main.js turns the 3D pages.
 */
export function createSketchUi(root, { onBack, onTurn }) {
  const el = document.createElement('div');
  el.className = 'board-ui';
  el.hidden = true;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'overlay-back';
  back.innerHTML = '<span aria-hidden="true">←</span> back to desk <kbd>esc</kbd>';
  back.addEventListener('click', onBack);

  const bar = document.createElement('div');
  bar.className = 'board-hint sketch-bar';
  bar.innerHTML = `
    <button type="button" class="sketch-turn" data-dir="-1" aria-label="Previous page">‹</button>
    <span class="sketch-count" aria-live="polite"></span>
    <button type="button" class="sketch-turn" data-dir="1" aria-label="Next page">›</button>
    <span class="sketch-hint">click a page or use ← →</span>`;
  for (const button of bar.querySelectorAll('.sketch-turn')) {
    button.addEventListener('click', () => onTurn(Number(button.dataset.dir)));
  }

  el.append(back, bar);
  root.appendChild(el);

  const [prev, next] = bar.querySelectorAll('.sketch-turn');
  const count = bar.querySelector('.sketch-count');

  return {
    show() { el.hidden = false; },
    hide() { el.hidden = true; },
    setSpread(spread, spreads) {
      count.textContent = `${spread + 1} / ${spreads}`;
      prev.disabled = spread === 0;
      next.disabled = spread === spreads - 1;
    },
  };
}

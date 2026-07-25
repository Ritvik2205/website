import {
  CORK_FILLERS,
  CORK_INTERACTIVE,
  CORK_PIN_NODES,
  CORK_STRINGS,
  resolveNodePercent,
} from '../../scene/corkboardLayout.js';

function hashHue(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function createCorkboardPage(experience) {
  const el = document.createElement('div');
  el.className = 'corkboard-page';

  const board = document.createElement('div');
  board.className = 'corkboard-board';
  el.appendChild(board);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('corkboard-strings');
  board.appendChild(svg);

  // Non-interactive dense fillers — same layout as the 3D default view
  for (const item of CORK_FILLERS) {
    const filler = document.createElement('div');
    filler.className = `board-filler board-filler--${item.kind}`;
    filler.setAttribute('aria-hidden', 'true');
    filler.style.left = `${item.left}%`;
    filler.style.top = `${item.top}%`;
    filler.style.width = `${item.w}%`;
    filler.style.height = `${item.h}%`;
    filler.style.setProperty('--note-rot', `${item.rot}deg`);
    const photo = document.createElement('span');
    photo.className = 'board-filler-photo';
    photo.style.setProperty('--photo-hue', String(hashHue(item.id)));
    filler.appendChild(photo);
    const pin = document.createElement('span');
    pin.className = 'note-pin';
    filler.appendChild(pin);
    board.appendChild(filler);
  }

  // Extra pin nodes for the web
  for (const node of CORK_PIN_NODES) {
    const pin = document.createElement('span');
    pin.className = 'board-web-pin';
    pin.setAttribute('aria-hidden', 'true');
    pin.style.left = `${node.left}%`;
    pin.style.top = `${node.top}%`;
    board.appendChild(pin);
  }

  const modal = document.createElement('div');
  modal.className = 'note-modal';
  modal.innerHTML = `
    <div class="note-modal-card">
      <button class="note-modal-close" aria-label="Close note">×</button>
      <h2></h2><p></p>
    </div>`;
  el.appendChild(modal);

  function closeModal() { modal.classList.remove('visible'); }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modal.querySelector('.note-modal-close').addEventListener('click', closeModal);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) {
      e.stopPropagation();
      closeModal();
    }
  });
  el.tabIndex = -1;

  const byId = new Map(experience.map((note) => [note.id, note]));
  const noteEls = new Map();

  CORK_INTERACTIVE.forEach((slot, i) => {
    const note = byId.get(slot.id);
    if (!note) return;
    const noteEl = document.createElement('button');
    noteEl.className = `board-note board-note--${note.type}`;
    noteEl.style.left = `${slot.left}%`;
    noteEl.style.top = `${slot.top}%`;
    noteEl.style.width = `${slot.w}%`;
    noteEl.style.setProperty('--note-rot', `${slot.rot}deg`);
    noteEl.dataset.route = String(i + 1).padStart(2, '0');
    const route = noteEl.dataset.route;
    noteEl.innerHTML = `
      <span class="note-pin"></span>
      ${note.type === 'polaroid' ? '<span class="polaroid-photo"></span>' : ''}
      <span class="note-route">ROUTE ${route}</span>
      <span class="note-title">${note.title}</span>`;
    noteEl.addEventListener('click', () => {
      modal.querySelector('h2').textContent = note.title;
      modal.querySelector('p').textContent = note.body;
      modal.querySelector('.note-modal-card').dataset.type = note.type;
      modal.classList.add('visible');
      el.focus();
    });
    board.appendChild(noteEl);
    noteEls.set(note.id, noteEl);
  });

  function drawStrings() {
    const bounds = board.getBoundingClientRect();
    if (!bounds.width) return;
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    svg.innerHTML = '';

    for (const [aKey, bKey] of CORK_STRINGS) {
      const a = resolveNodePercent(aKey);
      const b = resolveNodePercent(bKey);
      if (!a || !b) continue;
      const x1 = (a.left / 100) * bounds.width;
      const y1 = (a.top / 100) * bounds.height;
      const x2 = (b.left / 100) * bounds.width;
      const y2 = (b.top / 100) * bounds.height;
      const sag = 18 + Math.abs(x2 - x1) * 0.04;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`,
      );
      svg.appendChild(path);
    }
  }

  requestAnimationFrame(() => requestAnimationFrame(drawStrings));
  window.addEventListener('resize', drawStrings);
  el.redrawStrings = drawStrings;

  return el;
}

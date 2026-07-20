const NOTE_LAYOUT = [
  { left: 12, top: 18, rot: -3 },
  { left: 34, top: 14, rot: 2 },
  { left: 58, top: 20, rot: -2 },
  { left: 78, top: 15, rot: 4 },
  { left: 22, top: 56, rot: 3 },
  { left: 52, top: 60, rot: -4 },
  { left: 74, top: 58, rot: 2 },
  { left: 8,  top: 62, rot: -2 },
];

export function createCorkboardPage(experience) {
  const el = document.createElement('div');
  el.className = 'corkboard-page';

  const board = document.createElement('div');
  board.className = 'corkboard-board';
  el.appendChild(board);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('corkboard-strings');
  board.appendChild(svg);

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

  const noteEls = new Map();
  experience.forEach((note, i) => {
    const pos = NOTE_LAYOUT[i % NOTE_LAYOUT.length];
    const noteEl = document.createElement('button');
    noteEl.className = `board-note board-note--${note.type}`;
    noteEl.style.left = `${pos.left}%`;
    noteEl.style.top = `${pos.top}%`;
    noteEl.style.setProperty('--note-rot', `${pos.rot}deg`);
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
    for (const note of experience) {
      const from = noteEls.get(note.id);
      for (const targetId of note.connections) {
        const to = noteEls.get(targetId);
        if (!to) continue;
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const x1 = a.left - bounds.left + a.width / 2;
        const y1 = a.top - bounds.top + 8;
        const x2 = b.left - bounds.left + b.width / 2;
        const y2 = b.top - bounds.top + 8;
        const sag = 26 + Math.abs(x2 - x1) * 0.05;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`);
        svg.appendChild(path);
      }
    }
  }

  // layout must settle before measuring note positions
  requestAnimationFrame(() => requestAnimationFrame(drawStrings));
  window.addEventListener('resize', drawStrings);
  el.redrawStrings = drawStrings;

  return el;
}

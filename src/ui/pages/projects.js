export function createProjectsPage(projects) {
  const el = document.createElement('div');
  el.className = 'projects-desktop';

  const heading = document.createElement('h1');
  heading.className = 'page-heading page-heading--mono';
  heading.textContent = 'PROJECT ROUTING DESK';
  el.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'projects-grid';
  el.appendChild(grid);

  projects.forEach((p, i) => {
    const win = document.createElement('article');
    win.className = 'project-window';
    win.style.setProperty('--scatter-rot', `${[-1.2, 0.8, -0.6, 1.4][i % 4]}deg`);
    win.style.setProperty('--scatter-y', `${[0, 18, 6, 24][i % 4]}px`);

    const links = [
      p.repoUrl && `<a href="${p.repoUrl}" target="_blank" rel="noopener">repo ↗</a>`,
      p.liveUrl && `<a href="${p.liveUrl}" target="_blank" rel="noopener">live ↗</a>`,
    ].filter(Boolean).join('');

    win.innerHTML = `
      <header class="window-titlebar">
        <span class="route-mark">FILE ${String(i + 1).padStart(2, '0')}</span>
        <span class="window-title">${p.title}</span>
      </header>
      <img class="window-preview" src="${p.image}" alt="${p.title} preview" />
      <div class="window-body">
        <p>${p.description}</p>
        <div class="tech-tags">${p.tech.map((t) => `<span class="tech-tag">${t}</span>`).join('')}</div>
        <footer class="window-links">${links}</footer>
      </div>`;
    grid.appendChild(win);
  });

  return el;
}

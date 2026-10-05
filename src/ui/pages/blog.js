import gsap from 'gsap';
import { marked } from 'marked';

const SVG_NS = 'http://www.w3.org/2000/svg';

function addElement(parent, tagName, className, text = '') {
  const element = document.createElement(tagName);
  element.className = className;
  if (text) element.textContent = text;
  parent.appendChild(element);
  return element;
}

function addSvgElement(parent, tagName, className, attributes) {
  const element = document.createElementNS(SVG_NS, tagName);
  if (typeof element.className === 'string') element.className = className;
  else element.className.baseVal = className;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  parent.appendChild(element);
  return element;
}

function spiralPoint(progress, offset = 0) {
  const angle = -Math.PI / 2 + progress * Math.PI * 5.15;
  const radius = 43 - progress * 38 + offset;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function spiralPath(offset = 0) {
  return Array.from({ length: 120 }, (_, index) => {
    const point = spiralPoint(index / 119, offset);
    return `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }).join(' ');
}

export function createBlogPage(posts) {
  const entries = Array.isArray(posts) ? posts : [];
  const el = document.createElement('div');
  el.className = 'journal-page';

  const title = addElement(el, 'header', 'journal-heading');
  title.setAttribute('data-reveal', '');
  addElement(title, 'p', 'journal-kicker', 'journal / descent map');
  addElement(title, 'h1', 'journal-title', 'take the long way down');

  const map = addElement(el, 'div', 'journal-map');
  map.setAttribute('aria-label', 'A top-down rollercoaster map of journal entries');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  map.appendChild(svg);
  addSvgElement(svg, 'circle', 'journal-void', { cx: 50, cy: 50, r: 8 });
  addSvgElement(svg, 'path', 'journal-rail journal-rail-outer', { d: spiralPath(-1.8) });
  addSvgElement(svg, 'path', 'journal-rail journal-rail-inner', { d: spiralPath(1.8) });
  for (let index = 0; index < 44; index += 1) {
    const progress = index / 43;
    const from = spiralPoint(progress, -2.4);
    const to = spiralPoint(progress, 2.4);
    addSvgElement(svg, 'line', 'journal-tie', {
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
    });
  }
  const start = spiralPoint(0);
  const car = addSvgElement(svg, 'circle', 'journal-car', { cx: start.x, cy: start.y, r: 2.1 });

  const modal = addElement(el, 'dialog', 'journal-article-modal');
  modal.hidden = true;
  modal.setAttribute('aria-labelledby', 'journal-article-title');
  const close = addElement(modal, 'button', 'journal-article-close', 'close entry');
  close.type = 'button';
  const article = addElement(modal, 'article', 'journal-article');
  const articleTitle = addElement(article, 'h2', 'journal-article-title');
  articleTitle.id = 'journal-article-title';
  const articleDate = addElement(article, 'p', 'journal-article-date');
  const articleBody = addElement(article, 'div', 'journal-article-body');
  let opener = null;
  let carTween = null;

  function closeArticle() {
    if (modal.open) modal.close();
    modal.hidden = true;
    opener?.focus();
    opener = null;
  }

  close.addEventListener('click', closeArticle);
  modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeArticle();
  });
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeArticle();
    }
  });

  function openArticle(post, station) {
    opener = station;
    articleTitle.textContent = post.title || 'untitled entry';
    articleDate.textContent = post.date || 'undated';
    articleBody.innerHTML = marked.parse(post.body || '');
    modal.hidden = false;
    modal.showModal?.();
    close.focus();
  }

  if (entries.length) {
    const stationList = addElement(map, 'ol', 'journal-stations');
    entries.forEach((post, index) => {
      const stop = addElement(stationList, 'li', 'journal-stop');
      const station = addElement(stop, 'button', 'journal-station');
      station.type = 'button';
      const point = spiralPoint((index + 0.35) / (entries.length + 0.7));
      stop.style.left = `${point.x}%`;
      stop.style.top = `${point.y}%`;
      station.setAttribute('aria-label', `Read ${post.title || 'untitled entry'}`);
      addElement(station, 'span', 'journal-station-number', String(index + 1).padStart(2, '0'));
      addElement(station, 'span', 'journal-station-title', post.title || 'untitled entry');
      addElement(station, 'span', 'journal-station-date', post.date || 'undated');
      station.addEventListener('click', () => openArticle(post, station));
    });
  } else {
    addElement(map, 'p', 'journal-empty', 'No entries have reached the station yet.');
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hooks = {
    onOpen: () => {
      if (reduced) return;
      carTween?.kill();
      const progress = { value: 0 };
      carTween = gsap.to(progress, {
        value: 1,
        duration: 3.2,
        ease: 'power1.inOut',
        onUpdate: () => {
          const point = spiralPoint(progress.value);
          car.setAttribute('cx', point.x);
          car.setAttribute('cy', point.y);
        },
      });
    },
    onClose: () => {
      carTween?.kill();
      carTween = null;
      closeArticle();
    },
  };

  return { el, hooks };
}

import gsap from 'gsap';

/**
 * Idle-mode chrome: identity tag, one-click section nav, and a cursor tip that
 * names whatever desk object is hovered. Sections open through `onSelect(id)`,
 * the same path as clicking the object in 3D.
 */
export function createHud(root, { site, sections, onSelect, onLamp }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const labels = new Map(sections.map((s) => [s.id, s.label]));
  labels.set('lamp', 'Toggle the lamp');

  const el = document.createElement('div');
  el.className = 'hud';

  const id = document.createElement('header');
  id.className = 'hud-id';
  const links = [
    site.socials?.github && `<a href="${site.socials.github}" target="_blank" rel="noopener">GitHub ↗</a>`,
    site.socials?.email && `<a href="mailto:${site.socials.email}">Email</a>`,
  ].filter(Boolean).join('');
  id.innerHTML = `
    <p class="hud-name">${site.name}</p>
    ${site.role ? `<p class="hud-role">${site.role}</p>` : ''}
    <p class="hud-links">${links}</p>`;

  const nav = document.createElement('nav');
  nav.className = 'hud-nav';
  nav.setAttribute('aria-label', 'Sections');
  const indicator = document.createElement('span');
  indicator.className = 'hud-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.appendChild(indicator);

  const buttons = new Map();
  for (const s of sections) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hud-link';
    b.textContent = s.label;
    b.addEventListener('click', () => onSelect(s.id));
    nav.appendChild(b);
    buttons.set(s.id, b);
  }
  const lamp = document.createElement('button');
  lamp.type = 'button';
  lamp.className = 'hud-link hud-lamp';
  lamp.setAttribute('aria-label', 'Toggle desk lamp');
  lamp.setAttribute('aria-pressed', 'true');
  lamp.innerHTML = '<span class="hud-lamp-dot" aria-hidden="true"></span>';
  lamp.addEventListener('click', onLamp);
  nav.appendChild(lamp);
  buttons.set('lamp', lamp);

  const tip = document.createElement('div');
  tip.className = 'hud-tip';
  tip.setAttribute('aria-hidden', 'true');

  el.append(id, nav, tip);
  root.appendChild(el);

  // Sliding highlight follows hover/focus across the nav pill.
  function moveIndicator(button) {
    if (!button) {
      gsap.to(indicator, { opacity: 0, duration: 0.2 });
      return;
    }
    const to = { x: button.offsetLeft, width: button.offsetWidth, opacity: 1 };
    if (reduced || !gsap.getProperty(indicator, 'opacity')) gsap.set(indicator, to);
    else gsap.to(indicator, { ...to, duration: 0.45, ease: 'expo.out' });
  }
  nav.addEventListener('pointerover', (e) => moveIndicator(e.target.closest('.hud-link')));
  nav.addEventListener('pointerleave', () => moveIndicator(null));
  nav.addEventListener('focusin', (e) => moveIndicator(e.target.closest('.hud-link')));
  nav.addEventListener('focusout', () => moveIndicator(null));

  window.addEventListener('pointermove', (e) => {
    tip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`;
  });

  let hoveredId = null;
  function setHover(objectId) {
    if (objectId === hoveredId) return;
    buttons.get(hoveredId)?.classList.remove('is-hover');
    hoveredId = objectId;
    const button = buttons.get(objectId);
    button?.classList.add('is-hover');
    moveIndicator(button ?? null);
    if (objectId) {
      tip.innerHTML = `${labels.get(objectId) ?? objectId}<span>${objectId === 'lamp' ? 'click' : 'click to open'}</span>`;
    }
    tip.classList.toggle('visible', !!objectId);
  }

  function setVisible(visible) {
    el.classList.toggle('hidden', !visible);
    // inert: no clicks or focus while hidden (an #ui > * rule would otherwise re-enable pointer events).
    el.inert = !visible;
    if (!visible) setHover(null);
    if (reduced) {
      gsap.set([id, nav], { opacity: visible ? 1 : 0 });
      return;
    }
    gsap.fromTo([id, nav], { opacity: visible ? 0 : 1, y: visible ? 12 : 0 }, {
      opacity: visible ? 1 : 0, y: visible ? 0 : 12, duration: visible ? 0.6 : 0.25, stagger: 0.06, ease: 'expo.out',
    });
  }

  function setLamp(on) {
    lamp.setAttribute('aria-pressed', String(on));
  }

  setVisible(false);
  return { setHover, setVisible, setLamp };
}

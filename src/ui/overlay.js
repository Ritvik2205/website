import gsap from 'gsap';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createOverlayManager(root) {
  const pages = new Map();
  const hooks = new Map();
  let current = null;
  let currentId = null;
  let onCloseRequest = null;

  function register(id, el, pageHooks = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'overlay-page';
    const back = document.createElement('button');
    back.className = 'overlay-back';
    back.innerHTML = '<span aria-hidden="true">←</span> back to desk <kbd>esc</kbd>';
    back.addEventListener('click', () => onCloseRequest?.());
    wrap.append(back, el);
    root.appendChild(wrap);
    pages.set(id, wrap);
    hooks.set(id, pageHooks);
  }

  /** `origin` is the clicked object's screen point; the page reveals outward from it. */
  async function open(id, { origin } = {}) {
    current = pages.get(id);
    currentId = id;
    current.classList.add('visible');
    hooks.get(id)?.onOpen?.();

    if (reducedMotion()) {
      gsap.set(current, { opacity: 1, clipPath: 'none' });
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const { x = w / 2, y = h / 2 } = origin ?? {};
    const radius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    const tl = gsap.timeline();
    tl.fromTo(current,
      { opacity: 1, clipPath: `circle(0px at ${x}px ${y}px)` },
      { clipPath: `circle(${radius}px at ${x}px ${y}px)`, duration: 0.75, ease: 'expo.out', clearProps: 'clipPath' });
    const items = current.querySelectorAll('[data-reveal]');
    if (items.length) {
      tl.from(items, {
        y: 28, opacity: 0, duration: 0.7, stagger: 0.045, ease: 'expo.out', clearProps: 'transform,opacity',
      }, 0.12);
    }
    await tl.then();
  }

  async function close() {
    if (!current) return;
    hooks.get(currentId)?.onClose?.();
    if (reducedMotion()) gsap.set(current, { opacity: 0 });
    else await gsap.to(current, { opacity: 0, duration: 0.3, ease: 'power2.in' }).then();
    current.classList.remove('visible');
    current = null;
    currentId = null;
  }

  return {
    register, open, close,
    isOpen: () => !!current,
    setCloseHandler: (fn) => { onCloseRequest = fn; },
  };
}

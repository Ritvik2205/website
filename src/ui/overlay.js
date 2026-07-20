import gsap from 'gsap';

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
    back.textContent = '← back to desk';
    back.addEventListener('click', () => onCloseRequest?.());
    wrap.append(back, el);
    root.appendChild(wrap);
    pages.set(id, wrap);
    hooks.set(id, pageHooks);
  }

  async function open(id) {
    current = pages.get(id);
    currentId = id;
    current.classList.add('visible');
    hooks.get(id)?.onOpen?.();
    await gsap.fromTo(current, { opacity: 0 }, { opacity: 1, duration: 0.45 }).then();
  }

  async function close() {
    if (!current) return;
    hooks.get(currentId)?.onClose?.();
    await gsap.to(current, { opacity: 0, duration: 0.35 }).then();
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

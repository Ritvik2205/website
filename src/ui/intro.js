import gsap from 'gsap';

const BOOT_LINES = [
  'OPENING MONSOON POSTROOM...',
  'INDEXING LETTERS...',
  'ROUTING PROJECT ARCHIVE...',
  'PINNING FIELD NOTES...',
  'WARMING DESK LAMP...',
  'POSTROOM READY.',
];

// Opacity keyframes for the arrival strike: hard white-out, dip, softer re-flash, fade.
const STRIKE = [
  { opacity: 1, duration: 0.06, ease: 'none' },
  { opacity: 0.18, duration: 0.12, ease: 'power1.out' },
  { opacity: 0.75, duration: 0.07, ease: 'none' },
  { opacity: 0, duration: 0.9, ease: 'power2.out' },
];

export function runIntro(camera, rig, { onStrike = () => {} } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revisit = localStorage.getItem('visited');

  if (reduced || revisit) {
    camera.position.copy(rig.HOME.position);
    camera.lookAt(rig.HOME.lookAt);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const intro = document.createElement('div');
    intro.className = 'intro';
    intro.innerHTML = `
      <button class="intro-skip">skip ›</button>
      <div class="intro-floppy-stage">
        <button class="floppy" aria-label="Open the Monsoon Postroom">
          <img class="floppy-art" src="/assets/postroom/floppy.png" alt="" />
          <span class="floppy-fallback" aria-hidden="true">
            <span class="floppy-shutter"></span>
            <span class="floppy-label">POSTROOM / 01</span>
          </span>
        </button>
        <p class="intro-prompt">insert correspondence disk</p>
      </div>
      <pre class="intro-boot" hidden></pre>`;
    document.body.appendChild(intro);

    let finished = false;
    async function finish(skipped = false) {
      if (finished) return;
      finished = true;
      localStorage.setItem('visited', '1');
      camera.position.copy(rig.HOME.position);
      camera.lookAt(rig.HOME.lookAt);
      if (skipped) {
        await gsap.to(intro, { opacity: 0, duration: 0.5 }).then();
        intro.remove();
        resolve();
        return;
      }
      // Open straight onto the desk under a single lightning strike: the flash
      // whites out the intro, which is swapped for the desk at the peak.
      const flash = document.createElement('div');
      flash.className = 'intro-flash';
      document.body.appendChild(flash);
      const [peak, ...decay] = STRIKE;
      await gsap.fromTo(flash, { opacity: 0 }, peak).then();
      intro.remove();
      onStrike();
      const tl = gsap.timeline();
      for (const step of decay) tl.to(flash, step);
      await tl.then();
      flash.remove();
      resolve();
    }

    intro.querySelector('.intro-skip').addEventListener('click', () => finish(true));

    const floppy = intro.querySelector('.floppy');
    intro.querySelector('.floppy-art').addEventListener('error', () => {
      floppy.classList.add('asset-missing');
    });

    floppy.addEventListener('click', async () => {
      intro.querySelector('.intro-floppy-stage').hidden = true;
      const boot = intro.querySelector('.intro-boot');
      boot.hidden = false;
      for (const line of BOOT_LINES) {
        if (finished) return;
        boot.textContent += line + '\n';
        await new Promise((r) => setTimeout(r, 260));
      }
      finish(false);
    });
  });
}

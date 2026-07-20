import gsap from 'gsap';

const BOOT_LINES = [
  'LOADING RITVIK.SYS...',
  'MOUNTING /desk...',
  'LAMP... OK',
  'VINYL... OK',
  'MEMORIES... OK',
  'WELCOME.',
];

export function runIntro(camera, rig) {
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
        <button class="floppy" aria-label="boot">
          <span class="floppy-shutter"></span>
          <span class="floppy-label">RITVIK.SYS</span>
        </button>
        <p class="intro-prompt">click the floppy to boot</p>
      </div>
      <pre class="intro-boot" hidden></pre>`;
    document.body.appendChild(intro);

    let finished = false;
    async function finish(skipped = false) {
      if (finished) return;
      finished = true;
      localStorage.setItem('visited', '1');
      await gsap.to(intro, { opacity: 0, duration: 0.5 }).then();
      intro.remove();
      if (skipped) {
        camera.position.copy(rig.HOME.position);
        camera.lookAt(rig.HOME.lookAt);
      } else {
        camera.position.set(0, 1.6, 3.4);
        camera.lookAt(rig.HOME.lookAt);
        await gsap.to(camera.position, {
          x: rig.HOME.position.x, y: rig.HOME.position.y, z: rig.HOME.position.z,
          duration: 2, ease: 'power3.inOut',
          onUpdate: () => camera.lookAt(rig.HOME.lookAt),
        }).then();
      }
      resolve();
    }

    intro.querySelector('.intro-skip').addEventListener('click', () => finish(true));

    intro.querySelector('.floppy').addEventListener('click', async () => {
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

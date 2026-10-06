import gsap from 'gsap';

/**
 * Chrome for the vinyl focus mode: back pill, a "now spinning" chip, and a small
 * playlist window that pops in once the camera settles over the record.
 */
export function createMusicUi(root, { site, onBack }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'board-ui';
  el.hidden = true;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'overlay-back';
  back.innerHTML = '<span aria-hidden="true">←</span> back to desk <kbd>esc</kbd>';
  back.addEventListener('click', onBack);

  const chip = document.createElement('div');
  chip.className = 'music-chip';
  chip.innerHTML = `
    <span class="music-chip-dot" aria-hidden="true"></span>
    <span class="music-chip-label">Now spinning</span>
    <span class="music-chip-track" aria-live="polite">${site.name}'s rotation</span>
    <button type="button" class="music-chip-open" hidden>Playlist ↗</button>`;

  const win = document.createElement('section');
  win.className = 'music-window';
  win.hidden = true;
  win.setAttribute('aria-label', 'Playlist');
  win.innerHTML = `
    <header class="music-window-bar">
      <span class="music-window-title">playlist.fm</span>
      <button type="button" class="music-window-close" aria-label="Close playlist">×</button>
    </header>
    <div class="music-window-body"></div>
    <a class="music-window-link" href="${site.spotify.profileUrl}" target="_blank" rel="noopener">find me on spotify ↗</a>`;

  const open = chip.querySelector('.music-chip-open');
  const track = chip.querySelector('.music-chip-track');
  let embedded = false;

  function showPopup() {
    if (!embedded) {
      // Load the embed only on first open so the desk view stays light.
      win.querySelector('.music-window-body').innerHTML = `
        <iframe class="music-window-embed" title="Spotify playlist"
          src="https://open.spotify.com/embed/playlist/${site.spotify.playlistId}?theme=0"
          width="100%" height="352" frameborder="0" loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`;
      embedded = true;
    }
    win.hidden = false;
    open.hidden = true;
    if (!reduced) gsap.fromTo(win, { opacity: 0, scale: 0.94, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'expo.out', clearProps: 'opacity,transform' });
  }

  function hidePopup() {
    if (win.hidden) return false;
    win.hidden = true;
    open.hidden = false;
    return true;
  }

  win.querySelector('.music-window-close').addEventListener('click', hidePopup);
  open.addEventListener('click', showPopup);
  el.append(back, chip, win);
  root.appendChild(el);

  let popupTimer = null;
  return {
    show() {
      el.hidden = false;
      if (!reduced) gsap.fromTo([back, chip], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'expo.out', clearProps: 'opacity,transform' });
      // Let the record spin on its own for a beat before the window pops in.
      popupTimer = setTimeout(showPopup, reduced ? 0 : 650);
    },
    hide() {
      clearTimeout(popupTimer);
      el.hidden = true;
      hidePopup();
    },
    hidePopup,
    /** `{ isPlaying, title, artist }` from content/spotify.js. */
    setNowPlaying(np) {
      chip.querySelector('.music-chip-label').textContent = np.isPlaying ? 'Now spinning' : 'On the deck';
      track.textContent = np.artist ? `${np.title} — ${np.artist}` : np.title;
      chip.classList.toggle('is-live', !!np.isPlaying);
    },
  };
}

import gsap from 'gsap';

export function createMusicPage(site) {
  const el = document.createElement('div');
  el.className = 'music-page';
  el.innerHTML = `
    <div class="music-vinyl">
      <div class="vinyl-disc">
        <div class="vinyl-label"><span>Ritvik's<br>rotation</span></div>
      </div>
    </div>
    <div class="music-panel">
      <h1 class="page-heading">now spinning</h1>
      <iframe
        class="spotify-embed"
        src="https://open.spotify.com/embed/playlist/${site.spotify.playlistId}?theme=0"
        width="380" height="500" frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"></iframe>
      <a class="spotify-link" href="${site.spotify.profileUrl}" target="_blank" rel="noopener">
        find me on spotify ↗
      </a>
    </div>`;

  let spinTween = null;
  const hooks = {
    onOpen: () => {
      spinTween = gsap.to(el.querySelector('.vinyl-disc'), {
        rotation: 360, repeat: -1, ease: 'none', duration: 3,
      });
    },
    onClose: () => { spinTween?.kill(); spinTween = null; },
  };

  return { el, hooks };
}

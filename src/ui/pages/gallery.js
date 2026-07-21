export function createGalleryPage(gallery) {
  const el = document.createElement('div');
  el.className = 'gallery-page';

  const strip = document.createElement('div');
  strip.className = 'gallery-strip';
  el.appendChild(strip);

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = '<img alt="" /><figcaption></figcaption>';
  el.appendChild(lightbox);

  function closeLightbox() { lightbox.classList.remove('visible'); }
  lightbox.addEventListener('click', closeLightbox);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('visible')) {
      e.stopPropagation();
      closeLightbox();
    }
  });

  for (const item of gallery) {
    const itemButton = document.createElement('button');
    itemButton.type = 'button';
    itemButton.className = `gallery-item gallery-item--${item.type}`;
    itemButton.innerHTML = `
      <img src="${item.src}" alt="" loading="lazy" />
      <span class="gallery-caption">${item.caption}</span>`;
    itemButton.addEventListener('click', () => {
      lightbox.querySelector('img').src = item.src;
      lightbox.querySelector('figcaption').textContent = item.caption;
      lightbox.classList.add('visible');
      el.focus();
    });
    strip.appendChild(itemButton);
  }

  // vertical wheel drives horizontal scroll
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      strip.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  el.tabIndex = -1; // so the ESC keydown handler above can fire
  return el;
}

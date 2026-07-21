import gsap from 'gsap';
import { marked } from 'marked';

export function createBlogPage(posts) {
  const el = document.createElement('div');
  el.className = 'blog-page';

  const binder = document.createElement('div');
  binder.className = 'binder';
  binder.innerHTML = `
    <div class="binder-rings">
      <span class="ring"></span><span class="ring"></span><span class="ring"></span>
    </div>
    <div class="binder-pages"></div>`;
  el.appendChild(binder);

  const pagesEl = binder.querySelector('.binder-pages');
  let flipping = false;

  function indexPage() {
    const page = document.createElement('div');
    page.className = 'binder-page';
    page.innerHTML = `
      <h2 class="binder-title">ritvik's journal — index</h2>
      <ol class="post-index">
        ${posts.map((p, i) => `
          <li><button class="post-link" data-index="${i}">
            <span>${p.title}</span><span class="post-date">${p.date}</span>
          </button></li>`).join('')}
      </ol>`;
    page.querySelectorAll('.post-link').forEach((btn) => {
      btn.addEventListener('click', () => flipTo(postPage(posts[btn.dataset.index])));
    });
    return page;
  }

  function postPage(post) {
    const page = document.createElement('div');
    page.className = 'binder-page';
    page.innerHTML = `
      <button class="post-back">← index</button>
      <h2 class="binder-title">${post.title}</h2>
      <div class="post-date">${post.date}</div>
      <div class="post-body">${marked.parse(post.body)}</div>`;
    page.querySelector('.post-back').addEventListener('click', () => flipTo(indexPage(), true));
    return page;
  }

  function flipTo(nextPage, backwards = false) {
    if (flipping) return;
    flipping = true;
    const current = pagesEl.firstElementChild;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.replaceWith(nextPage);
      flipping = false;
      return;
    }
    pagesEl.insertBefore(nextPage, current);
    gsap.set(nextPage, { rotationY: backwards ? 0 : 0 });
    gsap.set(current, { zIndex: 2, transformOrigin: 'left center' });
    gsap.to(current, {
      rotationY: backwards ? 180 : -180,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => { current.remove(); flipping = false; },
    });
  }

  pagesEl.appendChild(indexPage());
  return el;
}

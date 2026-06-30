const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const themeStorageKey = 'ui:theme';

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getRequestedTheme() {
  const saved = localStorage.getItem(themeStorageKey);
  return saved === 'light' || saved === 'dark' ? saved : getSystemTheme();
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode', nextTheme === 'dark');
  document.body.classList.toggle('light-mode', nextTheme === 'light');
  document.documentElement.style.colorScheme = nextTheme;

  qsa('[data-theme-toggle]').forEach(button => {
    const isDark = nextTheme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    button.title = `Switch to ${isDark ? 'light' : 'dark'} mode`;
    button.innerHTML = isDark
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"></circle><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="2" stroke-linecap="square"></path></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 15.31A8 8 0 118.69 4 6.5 6.5 0 0020 15.31z" fill="currentColor"></path></svg>';
  });
}

function lockPageScroll(locked) {
  document.documentElement.classList.toggle('modal-open', locked);
  document.body.classList.toggle('modal-open', locked);
}

function initTheme() {
  applyTheme(getRequestedTheme());

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      if (!localStorage.getItem(themeStorageKey)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }
}

applyTheme(getRequestedTheme());
document.addEventListener('DOMContentLoaded', initTheme);

function initNavbarScrollState() {
  const nav = qs('.nav');
  if (!nav) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const currentY = window.scrollY;
    const shouldHide = currentY > 140 && currentY > lastY && !document.body.classList.contains('mobile-nav-open') && !document.body.classList.contains('modal-open');

    nav.classList.toggle('nav--scrolled', currentY > 8);
    nav.classList.toggle('invisible', shouldHide);
    lastY = currentY;
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
}

function injectUIStyles() {
  if (qs('#tutz-ui-styles')) return;
  const style = document.createElement('style');
  style.id = 'tutz-ui-styles';
  style.textContent = `
#toast-container {
  position: fixed;
  top: 97px;
  right: 12px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}
.toast {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  max-width: 420px;
  padding: 14px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.025)), rgba(12, 14, 20, 0.66);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(22px) saturate(150%);
  color: #fff;
  opacity: 0;
  transform: translate3d(0, 20px, 0);
  transition: opacity 240ms ease, transform 240ms ease;
  pointer-events: auto;
}
.toast-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.toast-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  font-size: 16px;
}
.toast-body {
  font-size: 0.94rem;
  line-height: 1.4;
}
.toast-success { border: 1px solid rgba(60, 220, 150, 0.24); }
.toast-info { border: 1px solid rgba(94, 153, 255, 0.22); }
.toast-warning { border: 1px solid rgba(243, 185, 69, 0.22); }
.toast-error { border: 1px solid rgba(237, 100, 100, 0.22); }
.home-carousel {
  padding: 24px 0;
}
.carousel-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 18px;
}
.carousel-description {
  color: rgba(255,255,255,0.75);
  max-width: 560px;
}
.image-carousel-shell {
  display: grid;
  gap: 16px;
}
.image-scroller {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 26px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
}
.image-track {
  display: flex;
  align-items: stretch;
  gap: 16px;
  padding: 18px;
  min-width: max-content;
}
.image-item {
  flex: 0 0 280px;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  box-shadow: 0 18px 40px rgba(0,0,0,0.16);
  transition: transform 220ms ease;
}
.image-item:hover {
  transform: translateY(-4px);
}
.image-item img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  display: block;
}
.image-caption {
  padding: 14px 16px;
  font-weight: 700;
  color: #fff;
  background: rgba(0,0,0,0.12);
}
.image-scroller-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.carousel-button {
  border: none;
  background: rgba(255,255,255,0.09);
  color: #fff;
  padding: 12px 18px;
  border-radius: 999px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}
.carousel-button:hover {
  background: rgba(255,255,255,0.14);
  transform: translateY(-1px);
}
@media (max-width: 860px) {
  .image-item { flex: 0 0 220px; }
  .image-caption { padding: 12px 14px; }
}
@media (max-width: 660px) {
  .image-track { gap: 12px; padding: 12px; }
  .image-item { flex: 0 0 180px; }
  .carousel-header { flex-direction: column; align-items: stretch; }
}
`;
  document.head.appendChild(style);
}

const navExtrasMenuConfig = [
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Video Tutorials', href: '#' },
      { label: 'Code Examples', href: '#' }
    ]
  },
  {
    title: 'Communities',
    links: [
      { label: 'Discord Server', href: 'https://discord.tutz.xyz', target: '_blank' },
    ]
  },
  {
    title: 'Events & Account management',
    links: [
      { label: 'Discord Hub', href: 'extras.html#discord-connect' },
      { label: 'Events Calendar', href: 'extras.html#events' },
    ]
  },
  {
    title: 'About TUTZ',
    links: [
      { label: 'What is TUTZ?', href: '#' },
      { label: 'Blog Posts', href: 'articles.html' },
      { label: 'FAQ', href: '#' }
    ]
  }
];

// Check auth state and update nav
const toastStateKey = 'tutz-auth-state';

function createToastContainer() {
  if (qs('#toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'true');
  document.body.appendChild(container);
}

function showToast(message, options = {}) {
  const { type = 'success', duration = 5000 } = options;
  createToastContainer();
  const container = qs('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon" aria-hidden="true">${type === 'success' ? '✔' : type === 'warning' ? '⚠' : type === 'error' ? '✖' : 'ℹ'}</div>
    <div class="toast-body"><strong>${message}</strong></div>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

async function updateAuthUI() {
  try {
    const response = await fetch('/auth/user');
    const data = await response.json();

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const profileBtn = document.getElementById('profile-btn');
    const navProfileAvatar = document.getElementById('nav-profile-avatar');
    const previousState = sessionStorage.getItem(toastStateKey);

    if (data.authenticated) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'flex';
      if (profileBtn) profileBtn.style.display = 'flex';
      if (navProfileAvatar && data.user) {
        const avatarUrl = data.user.avatar
          ? `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.png?size=64`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.user.id) % 5}.png?size=64`;
        navProfileAvatar.src = avatarUrl;
      }
      if (previousState !== 'authenticated') {
        showToast('Successfully logged in', { type: 'success' });
        sessionStorage.setItem(toastStateKey, 'authenticated');
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (profileBtn) profileBtn.style.display = 'none';
      if (previousState === 'authenticated') {
        showToast('Logged out successfully', { type: 'info' });
      }
      sessionStorage.setItem(toastStateKey, 'signed-out');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

function normalizeNavPath(path) {
  return String(path || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/, '');
}

function markActiveNavLink() {
  const currentPath = normalizeNavPath(window.location.pathname);
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    let linkPath;
    try {
      linkPath = normalizeNavPath(new URL(href, window.location.origin).pathname);
    } catch {
      linkPath = normalizeNavPath(href);
    }

    const isActive = currentPath === linkPath || (currentPath === '' && linkPath === 'index');
    const profileActive = currentPath === 'settings' && linkPath === 'profile';
    link.classList.toggle('active', isActive || profileActive);
  });
}

function initImageScroller() {
  const scroller = qs('#main-image-scroller');
  if (!scroller) return;

  const images = [
    { src: 'https://placehold.co/400x400', alt: 'Tools' },
    { src: 'https://placehold.co/400x400', alt: 'Trickets' },
    { src: 'https://placehold.co/400x400', alt: 'Undergrounded' },
    { src: 'https://placehold.co/48x48', alt: 'TUTZ' }
  ];

  const track = document.createElement('div');
  track.className = 'image-track';
  const buildItems = () => images.map(image => `
      <div class="image-item">
        <img src="${image.src}" alt="${image.alt}" />
        <div class="image-caption">${image.alt}</div>
      </div>
    `).join('');

  track.innerHTML = buildItems() + buildItems() + buildItems();
  scroller.innerHTML = '';
  scroller.appendChild(track);
  scroller.scrollLeft = 0;

  let speed = 0.35;
  let active = true;
  let rafId = null;
  const resetThreshold = track.scrollWidth / 3;

  const step = () => {
    if (active) {
      scroller.scrollLeft += speed;
      if (scroller.scrollLeft >= resetThreshold) {
        scroller.scrollLeft -= resetThreshold;
      }
    }
    rafId = requestAnimationFrame(step);
  };
  step();

  scroller.addEventListener('mouseenter', () => active = false);
  scroller.addEventListener('mouseleave', () => active = true);
  scroller.addEventListener('scroll', () => {
    if (scroller.scrollLeft >= resetThreshold) {
      scroller.scrollLeft -= resetThreshold;
    } else if (scroller.scrollLeft <= 0) {
      scroller.scrollLeft += resetThreshold;
    }
  });

  // Add click handlers for image inspection
  scroller.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (img) {
      openImageModal(img.src, img.alt);
    }
  });
}

function initNavExtrasMenu() {
  const wrapper = qs('.nav-extras-menu');
  if (!wrapper) return;

  wrapper.innerHTML = '';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-extras-toggle';
  toggle.setAttribute('aria-label', 'More options');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="5" r="1"></circle>
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="12" cy="19" r="1"></circle>
    </svg>
  `;

  const dropdown = document.createElement('div');
  dropdown.className = 'nav-extras-dropdown';

  navExtrasMenuConfig.forEach(section => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'expandable-section';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'expandable-button';
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `<span>${section.title}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    const content = document.createElement('div');
    content.className = 'expandable-content';

    section.links.forEach(link => {
      const anchor = document.createElement('a');
      anchor.className = 'sidebar-link';
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.target) anchor.target = link.target;
      content.appendChild(anchor);
    });

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isOpen));
      content.style.maxHeight = isOpen ? '0' : `${content.scrollHeight}px`;
    });

    sectionEl.append(button, content);
    dropdown.appendChild(sectionEl);
  });

  wrapper.append(toggle, dropdown);

  toggle.addEventListener('click', () => {
    const open = dropdown.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      dropdown.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      wrapper.querySelectorAll('.expandable-button').forEach(button => button.setAttribute('aria-expanded', 'false'));
    }
  });
}

if(qs('#jump-to-search')){
  qs('#jump-to-search').addEventListener('click', (e)=>{
  });
}
if(qs('#splash-arrow')){
  qs('#splash-arrow').addEventListener('click', (e)=>{ });
}

document.addEventListener('DOMContentLoaded', () => {
  injectUIStyles();
  initNavbarScrollState();
  initNavExtrasMenu();
  initMobileNav();
  createToastContainer();
  updateAuthUI();
  markActiveNavLink();
  initImageScroller();
  const navSearch = qs('.nav-search');
  const navSearchInput = qs('#nav-search');
  let activeSearchType = 'all';

  const searchDropdown = document.createElement('div');
  searchDropdown.id = 'nav-search-dropdown';
  searchDropdown.className = 'search-dropdown hidden';
  searchDropdown.innerHTML = `
    <div class="search-dropdown-content">
      <div class="search-tab-list">
        <button type="button" class="search-tab-button active" data-search-type="all">All</button>
        <button type="button" class="search-tab-button" data-search-type="articles">Articles</button>
        <button type="button" class="search-tab-button" data-search-type="tools">Tools</button>
        <button type="button" class="search-tab-button" data-search-type="users">Users</button>
        <button type="button" class="search-tab-button" data-search-type="wiki">Wiki</button>
      </div>
      <div id="search-dropdown-results" class="search-dropdown-results">
        <div class="muted" style="padding: 20px; text-align: center;">Type to search...</div>
      </div>
    </div>
  `;
  if (navSearch) {
    navSearch.style.position = 'relative';
    navSearch.appendChild(searchDropdown);
  }

  function openSearchDropdown() {
    searchDropdown.classList.remove('hidden');
    navSearchInput?.focus();
  }

  function closeSearchDropdown() {
    searchDropdown.classList.add('hidden');
  }

  // Search function
  async function performSearch(query, type) {
    if (!query.trim()) {
      qs('#search-dropdown-results').innerHTML = '<div class="muted" style="padding: 20px; text-align: center;">Type to search...</div>';
      return;
    }

    try {
      let results = { articles: [], tools: [], users: [], wiki: [] };
      const queryString = `/api/search?q=${encodeURIComponent(query)}${type !== 'wiki' ? `&type=${encodeURIComponent(type)}` : ''}`;
      const response = await fetch(queryString);
      const allResults = await response.json();

      if (type === 'all' || type === 'articles') {
        results.articles = allResults.articles || [];
      }
      if (type === 'all' || type === 'tools') {
        results.tools = allResults.tools || [];
      }
      if (type === 'all' || type === 'users') {
        results.users = allResults.users || [];
      }

      if (type === 'all' || type === 'wiki') {
        // Fetch wiki data
        const wikiResponse = await fetch('/api/wiki/enchantments.json');
        const wikiData = await wikiResponse.json();
        const wikiItems = wikiData.items || [];
        const wikiResults = [];
        for (const item of wikiItems) {
          if (item.name.toLowerCase().includes(query.toLowerCase()) || item.short.toLowerCase().includes(query.toLowerCase())) {
            wikiResults.push({ id: item.id, title: item.name, description: item.short });
          }
        }
        results.wiki = wikiResults;
      }

      const safeText = (value) => value ? value : query;
      let html = '<ul class="search-results-list">';

      if (results.articles.length > 0) {
        results.articles.forEach(article => {
          html += `<li><a href="/article/${article.id}">${safeText(article.title)} in Articles</a></li>`;
        });
      }

      if (results.tools.length > 0) {
        results.tools.forEach(tool => {
          html += `<li><a href="/tool/${tool.id}">${safeText(tool.name || tool.title)} in Tools</a></li>`;
        });
      }

      if (results.users.length > 0) {
        results.users.forEach(user => {
          html += `<li><a href="/profile?id=${user.id}">${safeText(user.username || user.name)} in Users</a></li>`;
        });
      }

      if (results.wiki.length > 0) {
        results.wiki.forEach(item => {
          html += `<li><a href="/wiki/enchantments.html#${item.id}">${safeText(item.title)} in Wiki</a></li>`;
        });
      }

      html += '</ul>';

      if (html === '<ul class="search-results-list"></ul>') {
        html = '<div class="muted" style="padding: 20px; text-align: center;">No results found</div>';
      }

      qs('#search-dropdown-results').innerHTML = html;
    } catch (error) {
      console.error('Search error:', error);
      qs('#search-dropdown-results').innerHTML = '<div class="muted" style="padding: 20px; text-align: center;">Search error</div>';
    }
  }

  // Event listeners
  navSearchInput?.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.trim()) {
      openSearchDropdown();
      performSearch(query, activeSearchType);
    } else {
      closeSearchDropdown();
    }
  });

  function setSearchType(type) {
    activeSearchType = type;
    qsa('.search-tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.searchType === type);
    });
    if (navSearchInput?.value.trim()) {
      performSearch(navSearchInput.value, type);
    }
  }

  qsa('.search-tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.searchType;
      setSearchType(type);
    });
  });

  qs('#nav-search-btn')?.addEventListener('click', () => {
    const query = navSearchInput?.value;
    if (query && query.trim()) {
      openSearchDropdown();
      performSearch(query, activeSearchType);
    }
  });

  qs('#nav-search')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value;
      if (query.trim()) {
        openSearchDropdown();
        performSearch(query, activeSearchType);
      }
    }
  });

  // CTRL+K and CMD+K for search
  document.addEventListener('keydown', (e)=>{
    if((e.ctrlKey || e.metaKey) && e.key === 'k'){
      e.preventDefault();
      openSearchDropdown();
    }
    if(e.key === 'Escape' && !searchDropdown.classList.contains('hidden')){
      closeSearchDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (navSearch && !navSearch.contains(e.target)) {
      closeSearchDropdown();
    }
  });
});

function initMobileNav() {
  const nav = qs('.nav');
  const navLinks = qs('.nav-links');
  if (!nav || !navLinks || qs('.mobile-nav-toggle')) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-nav-toggle';
  toggle.setAttribute('aria-label', 'Toggle navigation');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  nav.prepend(toggle);

  const close = () => {
    document.body.classList.remove('mobile-nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    lockPageScroll(false);
  };

  toggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('mobile-nav-open');
    document.body.classList.toggle('mobile-nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    lockPageScroll(open);
  });

  nav.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('.nav-link');
    if (link) close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) close();
  });
}

// Image inspection modal
function openImageModal(src, alt) {
  const modal = qs('#modal');
  const modalBody = qs('#modal-body');
  if (!modal || !modalBody) return;

  modal.classList.add('image-modal');
  modalBody.innerHTML = `
    <div class="image-modal-viewer">
      <div class="image-modal-tools" aria-label="Image zoom controls">
        <button type="button" data-zoom="out" aria-label="Zoom out">-</button>
        <button type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>
        <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
      </div>
      <div class="image-modal-stage">
        <img src="${src}" alt="${alt}" />
      </div>
    </div>
  `;

  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'flex';
  lockPageScroll(true);

  const image = modalBody.querySelector('img');
  let scale = 1;
  const setScale = value => {
    scale = Math.min(5, Math.max(0.5, value));
    image.style.transform = `scale(${scale})`;
  };

  modalBody.querySelector('[data-zoom="in"]')?.addEventListener('click', () => setScale(scale + 0.25));
  modalBody.querySelector('[data-zoom="out"]')?.addEventListener('click', () => setScale(scale - 0.25));
  modalBody.querySelector('[data-zoom="reset"]')?.addEventListener('click', () => setScale(1));
  modalBody.querySelector('.image-modal-stage')?.addEventListener('wheel', event => {
    event.preventDefault();
    setScale(scale + (event.deltaY < 0 ? 0.15 : -0.15));
  }, { passive: false });

  const closeModal = () => {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    modal.classList.remove('image-modal');
    lockPageScroll(false);
  };

  qs('#modal-close')?.addEventListener('click', closeModal, { once: true });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  }, { once: true });
}

window.openImageModal = openImageModal;

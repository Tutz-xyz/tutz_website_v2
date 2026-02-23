const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const topbar = document.querySelector('.nav');

if(qs('#jump-to-search')){
  qs('#jump-to-search').addEventListener('click', (e)=>{
  });
}
if(qs('#splash-arrow')){
  qs('#splash-arrow').addEventListener('click', (e)=>{ });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const rootBody = document.body;
  const saved = localStorage.getItem('ui:theme');
  rootBody.classList.add('light-mode');
  if(saved === 'light'){
    rootBody.classList.add('light-mode');
    document.querySelectorAll('#theme-toggle').forEach(b=>{ b.setAttribute('aria-pressed','true'); });
  }

  document.addEventListener('click', (e)=>{
    const t = e.target.closest && e.target.closest('#theme-toggle');
    if(!t) return;
    const pressed = t.getAttribute('aria-pressed') === 'true';
    if(pressed){
      t.setAttribute('aria-pressed','false');
      localStorage.removeItem('ui:theme');
    }else{
      document.body.classList.add('light-mode');
      document.querySelectorAll('#theme-toggle').forEach(b=> b.setAttribute('aria-pressed','true'));
      localStorage.setItem('ui:theme','light');
    }
  });

  if(qs('#market')){
    setTimeout(()=>{ if(typeof initMarketplace === 'function') initMarketplace(); }, 0);
  }

  if(qs('#blogs')){
    setTimeout(()=>{ if(typeof initBlogs === 'function') initBlogs(); }, 0);
  }
});

qsa('.faq-q').forEach(q=>{
  q.addEventListener('click', ()=>{
    const item = q.parentElement;
    item.classList.toggle('open');
  });
});

const modal = qs('#modal');
const modalBody = qs('#modal-body');
const modalCloseBtn = qs('#modal-close');
if(modal && modalBody){
  if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
}
function openModal(){ if(modal) modal.setAttribute('aria-hidden','false'); }
function closeModal(){ if(modal) modal.setAttribute('aria-hidden','true'); if(modalBody) modalBody.innerHTML=''; }

const API = {
  plugins: 'api/plugins/index.json',
  pluginBase: id => `api/plugins/${id}/manifest.json`,
  versions: id => `api/plugins/${id}/versions.json`
};

let marketplaceInit = false;
let allPlugins = [];
let currentResults = [];
let currentPage = 1;
const PAGE_SIZE = 6;

async function initMarketplace(){
  if(marketplaceInit) return;
  marketplaceInit = true;
  const resultsCountEl = qs('#results-count');
  if(resultsCountEl) resultsCountEl.textContent = 'Loading…';
  await fetchPlugins();
  populateCreators();
  setupControls();
  applyFilters();
  // ensure results-count updates even if no plugins
  if(resultsCountEl && currentResults.length === 0) resultsCountEl.textContent = '0 results';
}

async function fetchPlugins(){
  try{
    const res = await fetch(API.plugins);
    const data = await res.json();
    allPlugins = data.plugins || [];
  }catch(e){
    console.error('Failed to load plugins index', e);
    allPlugins = [];
  }
}

function populateCreators(){
  const creators = Array.from(new Set(allPlugins.map(p=>p.provider || 'Unknown'))).slice(0,8);
  const cont = qs('#creators-list');
  if(!cont) return; // guard when creators list is not present on the page
  cont.innerHTML = '';
  creators.forEach(c=>{
    const el = document.createElement('div');
    el.className = 'creator';
    el.innerHTML = `<div class="avatar" aria-hidden="true"></div><div><strong>${escapeHtml(c)}</strong><div class="muted small">Provider</div></div>`;
    cont.appendChild(el);
  });
}

function setupControls(){
  // convert search button into a compact icon button (SVG)
  const searchBtn = qs('#search-btn');
  if(searchBtn){
    searchBtn.classList.add('icon','btn','btn--purple');
    searchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="11" cy="11" r="6" stroke="white" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
    searchBtn.addEventListener('click', applyFilters);
  }
  const searchInput = qs('#search-input');
  if(searchInput) searchInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') applyFilters(); });
  ['filter-price','filter-mc','filter-platform','filter-provider','filter-official'].forEach(id=>{
    const el = qs(`#${id}`);
    if(el) el.addEventListener('change', ()=>{ currentPage = 1; applyFilters(); });
  });
  qs('#filter-provider')?.addEventListener('input', ()=>{ currentPage = 1; applyFilters(); });

  // FAQ toggles
  qsa('.faq-q').forEach(q=>{
    q.addEventListener('click', ()=>{
      const a = q.nextElementSibling;
      if(!a) return;
      const open = a.style.display !== 'none';
      a.style.display = open ? 'none' : 'block';
    });
  });
}

function applyFilters(){
  const q = (qs('#search-input')?.value || '').trim().toLowerCase();
  const price = qs('#filter-price')?.value || '';
  const mc = qs('#filter-mc')?.value || '';
  const platform = qs('#filter-platform')?.value || '';
  const provider = (qs('#filter-provider')?.value || '').trim().toLowerCase();

  currentResults = allPlugins.filter(p=>{
    if(q && !(p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q))) return false;
    if(price && String(p.price || '').toLowerCase() !== price) return false;
    if(mc && !(p.minecraft_versions||[]).includes(mc)) return false;
    if(platform && !(p.platforms||[]).includes(platform)) return false;
    if(provider && !(String(p.provider||'').toLowerCase().includes(provider))) return false;
    // official filter: expects plugin field `official`: true => official, false/absent => 3rd party
    const off = qs('#filter-official')?.value || '';
    if(off){
      if(off === 'official' && !p.official) return false;
      if(off === 'third' && p.official) return false;
    }
    return true;
  });

  renderResults();
}

function renderResults(){
  const container = qs('#plugins-list');
  const count = qs('#results-count');
  const total = currentResults.length;
  count.textContent = `${total} result${total===1?'':'s'}`;

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  currentPage = Math.min(currentPage, pages);

  const start = (currentPage-1)*PAGE_SIZE;
  const visible = currentResults.slice(start, start + PAGE_SIZE);

  container.innerHTML = '';
  if(visible.length === 0){
    container.innerHTML = '<div class="muted">No results</div>';
    renderPagination(pages);
    return;
  }

  visible.forEach(p=>{
    const el = document.createElement('div');
    el.className = 'plugin-card';
    const icon = p.icon ? `<img class="icon" src="${p.icon}" alt="">` : `<div class="icon"></div>`;
    // TODO: check if the tool is open source & remove the button if not, and make the open button actually open the plugin page
    const authorImg = p.author_icon ? `<img class="avatar" src="${p.author_icon}" alt="${escapeHtml(p.author||p.provider||'')}'s avatar" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">` : '';
    el.innerHTML = `
      ${icon}
      <div class="card-content">
        <div class="card-header">
          <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
            <h4>${escapeHtml(p.name)}</h4>
            <div class="author-row" style="display:flex;align-items:baseline;gap:8px;">
              ${authorImg}
              <a class="author-link" href="#" onclick="event.preventDefault()" style="color: #9370DB;">${escapeHtml(p.provider || p.author || 'Unknown')}</a>
            </div>
          </div>
        </div>

        <div class="tags-wrap" aria-hidden="false">
          ${(p.tags||[]).slice(0,4).map(t=>`<div class="tag" style="font-size:12px;padding:4px 8px">${escapeHtml(t)}</div>`).join('')}
        </div>

        <div class="description">${escapeHtml(p.description || '')}</div>

        <div class="card-actions">
          <button class="btn btn--purple" onclick="openPluginModal('${escapeHtml(p.id)}')">Open</button>
          <a class="btn" href="${p.url}" target="_blank" rel="noopener">Source</a>
        </div>
      </div>
    `;
    container.appendChild(el);
  });

  renderPagination(pages);
}

function renderPagination(pages){
  const cont = qs('#pagination');
  cont.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i===currentPage?' active':'');
    btn.textContent = i;
    btn.addEventListener('click', ()=>{ currentPage = i; renderResults(); });
    cont.appendChild(btn);
  }
}

async function openPluginModal(id){
  modalBody.innerHTML = `<div style="color:var(--muted)">Loading plugin…</div>`;
  openModal();
  try{
    const [manifestRes, versionsRes] = await Promise.all([
      fetch(API.pluginBase(id)),
      fetch(API.versions(id))
    ]);
    if(!manifestRes.ok) throw new Error('manifest not found');
    if(!versionsRes.ok) throw new Error('versions not found');
    const manifest = await manifestRes.json();
    const versions = await versionsRes.json();
    renderPlugin(manifest, versions);
  }catch(err){
    modalBody.innerHTML = `<div style="color:#ffb4b4">Failed to load plugin</div>`;
    console.error(err);
  }
}

function renderPlugin(manifest, versions){
  modalBody.innerHTML = `
    <h2>${escapeHtml(manifest.name)}</h2>
    <div class="plugin-meta">${escapeHtml(manifest.description)}</div>
    <div style="margin-top:12px">
      <strong>Author:</strong> ${escapeHtml(manifest.author)}<br>
      <strong>Id:</strong> ${escapeHtml(manifest.id)}
    </div>
    <div id="versions" style="margin-top:12px"></div>
  `;
  const vCont = qs('#versions');
  versions.versions.forEach(v=>{
    const row = document.createElement('div');
    row.className = 'version-item';
    row.innerHTML = `
      <div>
        <div><strong>${escapeHtml(v.version)}</strong> <small class="plugin-meta">${escapeHtml(v.date || '')}</small></div>
        <div class="plugin-meta">${escapeHtml(v.notes || '')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <a class="btn btn--purple" href="${v.download_url}" download>Download</a>
        <button class="btn" data-url="${v.download_url}" onclick="copyToClipboard(this.dataset.url)">Copy Link</button>
      </div>
    `;
    vCont.appendChild(row);
  });
}

// small helpers
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

window.copyToClipboard = async (txt) => {
  try{
    await navigator.clipboard.writeText(txt);
    alert('Link copied to clipboard');
  }catch(e){ alert('Could not copy'); }
};

if(qs('#hero-splash')) qs('#hero-splash').style.display = 'flex';
if(qs('#market')) qs('#market').style.display = '';

// auto-open marketplace if hash present
if(location.hash === '#tools' && qs('#jump-to-search')){ qs('#jump-to-search').click(); }


// --- BLOGS SECTION LOGIC ---
const BLOG_API = {
  blogs: 'api/blogs/index.json',
  blogBase: id => `api/blogs/${id}/manifest.json`
};
let allBlogs = [];
let blogResults = [];
let blogPage = 1;
const BLOG_PAGE_SIZE = 6;

async function initBlogs(){
  const countEl = qs('#blogs-results-count');
  if(countEl) countEl.textContent = 'Loading…';
  await fetchBlogs();
  setupBlogControls();
  applyBlogFilters();
  if(countEl && blogResults.length === 0) countEl.textContent = '0 results';
}

async function fetchBlogs(){
  try{
    const res = await fetch(BLOG_API.blogs);
    const data = await res.json();
    allBlogs = data.blogs || [];
  }catch(e){
    console.error('Failed to load blogs index', e);
    allBlogs = [];
  }
}

function setupBlogControls(){
  const searchBtn = qs('#blog-search-btn');
  if(searchBtn){
    searchBtn.classList.add('icon','btn','btn--purple');
    searchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="11" cy="11" r="6" stroke="white" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
    searchBtn.addEventListener('click', applyBlogFilters);
  }
  const searchInput = qs('#blog-search-input');
  if(searchInput) searchInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') applyBlogFilters(); });
  const authorInput = qs('#filter-author');
  if(authorInput) authorInput.addEventListener('input', ()=>{ blogPage = 1; applyBlogFilters(); });
}
// frankly no fucking clue what this is even doing
function applyBlogFilters(){
  const q = (qs('#blog-search-input')?.value || '').trim().toLowerCase();
  const author = (qs('#filter-author')?.value || '').trim().toLowerCase();
  blogResults = allBlogs.filter(b=>{
    if(q && !(b.title.toLowerCase().includes(q) || (b.description||'').toLowerCase().includes(q))) return false;
    if(author && !(String(b.author||'').toLowerCase().includes(author))) return false;
    return true;
  });
  renderBlogResults();
}

function renderBlogResults(){
  const container = qs('#blogs-list');
  const count = qs('#blogs-results-count');
  const total = blogResults.length;
  if(count) count.textContent = `${total} result${total===1?'':'s'}`;
  // pagination
  const pages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  blogPage = Math.min(blogPage, pages);
  const start = (blogPage-1)*BLOG_PAGE_SIZE;
  const visible = blogResults.slice(start, start + BLOG_PAGE_SIZE);
  container.innerHTML = '';
  if(visible.length === 0){
    container.innerHTML = '<div class="muted">No results</div>';
    renderBlogPagination(pages);
    return;
  }
  visible.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'plugin-card';
    const icon = b.icon ? `<img class="icon" src="${b.icon}" alt="">` : `<div class="icon"></div>`;
    el.innerHTML = `
      ${icon}
      <div class="card-content">
        <div class="card-header">
          <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
            <h4>${escapeHtml(b.title)}</h4>
            <div class="author-row"><a class="author-link" href="#" onclick="event.preventDefault()">${escapeHtml(b.author || 'Unknown')}</a></div>
          </div>
        </div>
        <div class="tags-wrap" aria-hidden="false">
          ${(b.tags||[]).slice(0,4).map(t=>`<div class="tag" style="font-size:12px;padding:4px 8px">${escapeHtml(t)}</div>`).join('')}
        </div>
        <div class="description">${escapeHtml(b.description || '')}</div>
        <div class="card-actions">
          <a class="btn btn--purple" href="article.html?id=${encodeURIComponent(b.id)}">Read</a>
        </div>
      </div>
    `;
    container.appendChild(el);
  });
  renderBlogPagination(pages);
}

function renderBlogPagination(pages){
  const cont = qs('#blogs-pagination');
  if(!cont) return;
  cont.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (i===blogPage?' active':'');
    btn.textContent = i;
    btn.addEventListener('click', ()=>{ blogPage = i; renderBlogResults(); });
    cont.appendChild(btn);
  }
}

let topbarTimer;
let lastScrollY = window.scrollY;
let mousePositionY = 0;
let isMouseInsideTopbar = false;

window.addEventListener('mousemove', (e) => {
	mousePositionY = e.clientY;
});

window.addEventListener('mousemove', () => {
	const topbarRect = topbar.getBoundingClientRect();
	isMouseInsideTopbar = (
		mousePositionY >= topbarRect.top &&
		mousePositionY <= topbarRect.bottom
	);
	
	if (isMouseInsideTopbar || mousePositionY < 50) {
		topbar.classList.add('visible');
		topbar.classList.remove('invisible');
		clearTimeout(topbarTimer);
	}
});

window.addEventListener('scroll', () => {
	if (window.scrollY < 20) {
		topbar.classList.add('visible');
		topbar.classList.remove('invisible');
		clearTimeout(topbarTimer);
		return;
	}
	if (window.scrollY < lastScrollY) {
		topbar.classList.add('visible');
		topbar.classList.remove('invisible');
		clearTimeout(topbarTimer);
		return;
	}
	
	if (window.scrollY > 20 && !isMouseInsideTopbar) {
		topbarTimer = setTimeout(() => {
			topbar.classList.add('invisible');
			topbar.classList.remove('visible');
		}, 3500);
	}
	
	lastScrollY = window.scrollY;
});

document.querySelector('.nav').addEventListener('mouseleave', () => {
	isMouseInsideTopbar = false;
	
	if (window.scrollY > 20 && !isMouseInsideTopbar) {
		topbarTimer = setTimeout(() => {
			topbar.classList.add('invisible');
			topbar.classList.remove('visible');
		}, 3500);
	}
});
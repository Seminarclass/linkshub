// DomainsHub — pure vanilla JS, no framework, no build step.
// Loads domains.json, renders the home grid, handles view switching,
// client-side search with the / keyboard shortcut.

(async () => {
  // ----- Load data -----
  let DATA = [];
  try {
    const res = await fetch('domains.json', { cache: 'force-cache' });
    DATA = await res.json();
  } catch (e) {
    console.error('Failed to load domains.json', e);
    return;
  }

  const totalDomains = DATA.reduce((s, c) => s + c.count, 0);
  const totalCats = DATA.length;

  // ----- Theme -----
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  document.getElementById('themeToggle').addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // ----- Update hero stats -----
  document.getElementById('totalCount').textContent = totalDomains.toLocaleString() + '+';
  document.getElementById('catCount').textContent = totalCats;
  animateCount('statDomains', totalDomains);
  animateCount('statCats', totalCats);

  function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 1000;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ----- Render category grid -----
  const catGrid = document.getElementById('catGrid');
  catGrid.innerHTML = DATA.map((c, i) => `
    <div class="cat-card" data-slug="${c.slug}" style="animation: fadeUp 0.4s var(--ease) ${i * 0.02}s backwards">
      <div class="cat-icon">${c.icon}</div>
      <div class="cat-info">
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.count} domains</div>
      </div>
      <svg class="cat-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </div>
  `).join('');

  // Inject the fadeUp keyframes
  const style = document.createElement('style');
  style.textContent = `@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  document.head.appendChild(style);

  // ----- Click handlers -----
  catGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.cat-card');
    if (!card) return;
    navigateToCategory(card.dataset.slug);
  });
  document.querySelectorAll('[data-nav="home"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); navigateHome(); });
  });

  function navigateToCategory(slug) {
    const cat = DATA.find(c => c.slug === slug);
    if (!cat) return;
    document.getElementById('catIcon').textContent = cat.icon;
    document.getElementById('catTitle').textContent = cat.name;
    document.getElementById('catMeta').textContent = `${cat.count} domains · curated by hand`;

    renderDomains(cat.domains, '');
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === 'alpha'));

    document.querySelector('[data-view="home"]').classList.add('hidden');
    document.querySelector('[data-view="category"]').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState({ slug }, '', `#${slug}`);
    // Reset filter
    const cs = document.getElementById('catSearch');
    if (cs) cs.value = '';
  }

  function navigateHome() {
    document.querySelector('[data-view="category"]').classList.add('hidden');
    document.querySelector('[data-view="home"]').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.pushState({}, '', location.pathname);
  }

  // ----- Render domain cards with per-letter colors -----
  const COLORS = [
    ['#818cf8', '#c084fc'], ['#c084fc', '#38bdf8'], ['#38bdf8', '#818cf8'],
    ['#fb923c', '#f43f5e'], ['#10b981', '#06b6d4'], ['#f59e0b', '#ef4444'],
    ['#8b5cf6', '#ec4899'], ['#06b6d4', '#10b981'], ['#f43f5e', '#fb923c'],
  ];
  function colorFor(d) {
    let hash = 0;
    for (let i = 0; i < d.length; i++) hash = (hash * 31 + d.charCodeAt(i)) | 0;
    return COLORS[Math.abs(hash) % COLORS.length];
  }
  function renderDomains(domains, filter, sort = 'alpha') {
    let list = domains;
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(d => d.includes(f));
    }
    if (sort === 'alpha') list = [...list].sort();
    else if (sort === 'length') list = [...list].sort((a, b) => a.length - b.length || a.localeCompare(b));
    else if (sort === 'random') list = [...list].sort(() => Math.random() - 0.5);

    const grid = document.getElementById('domainGrid');
    if (!list.length) {
      grid.innerHTML = `<div class="search-empty" style="grid-column:1/-1"><div class="search-empty-icon">🔍</div>No domains match "${filter}"</div>`;
      return;
    }
    grid.innerHTML = list.map((d, i) => {
      const [c1, c2] = colorFor(d);
      const letter = d.charAt(0).toUpperCase();
      return `
        <a class="domain-card" href="https://${d}" target="_blank" rel="noopener" style="animation: fadeUp 0.3s var(--ease) ${Math.min(i * 0.01, 0.4)}s backwards">
          <div class="domain-favicon" style="background: linear-gradient(135deg, ${c1}, ${c2})">${letter}</div>
          <div class="domain-name">${d}</div>
          <svg class="domain-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </a>
      `;
    }).join('');
  }

  // ----- Category controls -----
  const catSearch = document.getElementById('catSearch');
  let currentCatSlug = null;
  let currentSort = 'alpha';
  catSearch.addEventListener('input', (e) => {
    if (!currentCatSlug) return;
    const cat = DATA.find(c => c.slug === currentCatSlug);
    renderDomains(cat.domains, e.target.value, currentSort);
  });
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      if (currentCatSlug) {
        const cat = DATA.find(c => c.slug === currentCatSlug);
        renderDomains(cat.domains, catSearch.value, currentSort);
      }
    });
  });

  // Patch navigateToCategory to set currentCatSlug
  const origNav = navigateToCategory;
  navigateToCategory = function(slug) {
    currentCatSlug = slug;
    origNav(slug);
  };

  // ----- Hero search (big search) -----
  const bigSearch = document.getElementById('bigSearch');
  bigSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && bigSearch.value.trim()) {
      // Try category match first, then domain match
      const q = bigSearch.value.trim().toLowerCase();
      const cat = DATA.find(c => c.name.toLowerCase().includes(q));
      if (cat) {
        navigateToCategory(cat.slug);
        return;
      }
      // Find a category containing a matching domain
      for (const c of DATA) {
        if (c.domains.some(d => d.includes(q))) {
          navigateToCategory(c.slug);
          catSearch.value = bigSearch.value;
          const evt = new Event('input');
          catSearch.dispatchEvent(evt);
          return;
        }
      }
    }
  });

  // ----- Top search bar (also goes to category view) -----
  const topSearch = document.getElementById('search');
  topSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && topSearch.value.trim()) {
      const q = topSearch.value.trim().toLowerCase();
      const cat = DATA.find(c => c.name.toLowerCase().includes(q));
      if (cat) { navigateToCategory(cat.slug); topSearch.value = ''; return; }
      for (const c of DATA) {
        if (c.domains.some(d => d.includes(q))) {
          navigateToCategory(c.slug); topSearch.value = '';
          catSearch.value = topSearch.value || q;
          return;
        }
      }
    }
  });

  // ----- Search overlay (slash key) -----
  const overlay = document.getElementById('searchOverlay');
  const overlaySearch = document.getElementById('overlaySearch');
  const overlayResults = document.getElementById('overlayResults');
  let overlayActive = 0;
  let overlayItems = [];

  function openOverlay() {
    overlay.hidden = false;
    overlaySearch.value = '';
    overlaySearch.focus();
    renderOverlay('');
  }
  function closeOverlay() { overlay.hidden = true; }

  document.addEventListener('keydown', (e) => {
    // Slash to open (only when not typing in an input)
    const tag = (e.target.tagName || '').toLowerCase();
    const isInput = ['input', 'textarea'].includes(tag);
    if (e.key === '/' && !isInput && overlay.hidden) { e.preventDefault(); openOverlay(); return; }
    if (e.key === 'Escape' && !overlay.hidden) { closeOverlay(); return; }
    if (!overlay.hidden) {
      if (e.key === 'ArrowDown') { e.preventDefault(); overlayActive = Math.min(overlayActive + 1, overlayItems.length - 1); updateOverlayActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); overlayActive = Math.max(overlayActive - 1, 0); updateOverlayActive(); }
      else if (e.key === 'Enter' && overlayItems[overlayActive]) { e.preventDefault(); activateOverlayItem(overlayItems[overlayActive]); }
    }
  });

  document.getElementById('closeOverlay').addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });

  overlaySearch.addEventListener('input', (e) => renderOverlay(e.target.value));

  function renderOverlay(q) {
    const query = q.trim().toLowerCase();
    const cats = query ? DATA.filter(c => c.name.toLowerCase().includes(query)) : DATA.slice(0, 8);
    const domains = query ? DATA.flatMap(c => c.domains.filter(d => d.includes(query)).slice(0, 3).map(d => ({ d, c }))).slice(0, 30) : [];

    overlayItems = [];
    if (!query) {
      cats.forEach(c => overlayItems.push({ type: 'category', cat: c }));
    } else {
      cats.forEach(c => overlayItems.push({ type: 'category', cat: c }));
      domains.forEach(({ d, c }) => overlayItems.push({ type: 'domain', domain: d, cat: c }));
    }
    overlayActive = 0;

    if (!overlayItems.length) {
      overlayResults.innerHTML = `<div class="search-empty"><div class="search-empty-icon">🔍</div>No results for "<strong>${q}</strong>"</div>`;
      return;
    }

    const catSection = (query && cats.length) || !query ? `
      <div class="result-section-label">Categories</div>
      ${cats.map((c, i) => `
        <div class="result-item" data-type="cat" data-slug="${c.slug}">
          <div class="result-icon">${c.icon}</div>
          <div class="result-info">
            <div class="result-name">${c.name}</div>
            <div class="result-type">${c.count} domains</div>
          </div>
          <svg class="result-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
      `).join('')}` : '';

    const domSection = query && domains.length ? `
      <div class="result-section-label">Domains</div>
      ${domains.map(({ d, c }) => {
        const [col1, col2] = colorFor(d);
        return `
        <div class="result-item" data-type="domain" data-domain="${d}" data-slug="${c.slug}">
          <div class="result-icon" style="background: linear-gradient(135deg, ${col1}, ${col2}); color: white; font-weight: 700; font-family: var(--mono);">${d.charAt(0).toUpperCase()}</div>
          <div class="result-info">
            <div class="result-name">${d}</div>
            <div class="result-type">in ${c.name}</div>
          </div>
          <svg class="result-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
        </div>
      `}).join('')}` : '';

    overlayResults.innerHTML = catSection + domSection;
  }

  function updateOverlayActive() {
    overlayResults.querySelectorAll('.result-item').forEach((el, i) => {
      el.classList.toggle('active', i === overlayActive);
      if (i === overlayActive) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function activateOverlayItem(item) {
    closeOverlay();
    if (item.type === 'category') {
      navigateToCategory(item.cat.slug);
    } else if (item.type === 'domain') {
      window.open(`https://${item.domain}`, '_blank', 'noopener');
    }
  }

  overlayResults.addEventListener('click', (e) => {
    const item = e.target.closest('.result-item');
    if (!item) return;
    if (item.dataset.type === 'cat') {
      const found = overlayItems.find(i => i.type === 'category' && i.cat.slug === item.dataset.slug);
      if (found) activateOverlayItem(found);
    } else if (item.dataset.type === 'domain') {
      const found = overlayItems.find(i => i.type === 'domain' && i.domain === item.dataset.domain);
      if (found) activateOverlayItem(found);
    }
  });

  overlayResults.addEventListener('mousemove', (e) => {
    const item = e.target.closest('.result-item');
    if (!item) return;
    const all = Array.from(overlayResults.querySelectorAll('.result-item'));
    overlayActive = all.indexOf(item);
    updateOverlayActive();
  });

  // ----- Initial route from hash -----
  window.addEventListener('popstate', () => {
    const slug = location.hash.slice(1);
    if (slug) navigateToCategory(slug); else navigateHome();
  });
  if (location.hash) {
    const slug = location.hash.slice(1);
    if (DATA.some(c => c.slug === slug)) navigateToCategory(slug);
  }

})();

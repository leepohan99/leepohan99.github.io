(() => {
  const root = document.documentElement;
  const body = document.body;
  const byId = id => document.getElementById(id);
  const stored = (key, value) => {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch { return null; }
  };

  const themeButtons = [...document.querySelectorAll('.theme-choice')];
  function setTheme(next) {
    root.dataset.theme = next;
    for (const button of themeButtons) button.textContent = next === 'light' ? '深色' : '淺色';
    stored('little-chem-theme', next);
  }
  setTheme(stored('little-chem-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  for (const button of themeButtons) button.addEventListener('click', () => setTheme(root.dataset.theme === 'light' ? 'dark' : 'light'));
  const fontButton = byId('font-size');
  function setLarge(large) {
    root.dataset.large = String(large);
    fontButton.textContent = large ? '標準字' : '大字';
    fontButton.setAttribute('aria-pressed', String(large));
    stored('little-chem-large', String(large));
  }
  setLarge(stored('little-chem-large') === 'true');
  fontButton.addEventListener('click', () => setLarge(root.dataset.large !== 'true'));

  const mobile = matchMedia('(max-width: 900px)');
  const menuButton = byId('menu-open');
  const restore = byId('menu-restore');
  function showMobileMenu(show, returnFocus = false) {
    body.classList.toggle('menu-open', show);
    byId('overlay').hidden = !show;
    menuButton.setAttribute('aria-expanded', String(show));
    if (show) byId('sidebar-close').focus();
    else if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => showMobileMenu(!body.classList.contains('menu-open'), true));
  byId('overlay').addEventListener('click', () => showMobileMenu(false, true));
  mobile.addEventListener('change', () => showMobileMenu(false));
  byId('sidebar-close').addEventListener('click', () => {
    if (mobile.matches) {
      showMobileMenu(false, true);
      return;
    }
    body.classList.add('sidebar-off');
    restore.hidden = false;
    restore.focus();
  });
  restore.addEventListener('click', () => {
    body.classList.remove('sidebar-off');
    restore.hidden = true;
    byId('sidebar-close').focus();
  });

  const headings = [...document.querySelectorAll('.chapter-section')];
  const menuGroups = [...document.querySelectorAll('.contents details')];
  let active = '';
  let scheduled = false;
  function refreshReading() {
    scheduled = false;
    const available = root.scrollHeight - window.innerHeight;
    const percent = available > 0 ? Math.min(100, Math.max(0, Math.round(scrollY / available * 100))) : 100;
    byId('progress-text').textContent = percent + '%';
    byId('reading-progress').value = percent;
    let current = '';
    for (const section of headings) {
      if (section.getBoundingClientRect().top <= Math.min(innerHeight * .23, 170)) current = section.id;
      else break;
    }
    if (current === active) return;
    active = current;
    for (const group of menuGroups) {
      const selected = group.dataset.section === current;
      group.classList.toggle('active', selected);
      const link = group.querySelector('summary a');
      if (selected) {
        group.open = true;
        link.setAttribute('aria-current', 'location');
      } else link.removeAttribute('aria-current');
    }
  }
  function scheduleReading() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refreshReading);
  }
  document.addEventListener('scroll', scheduleReading, {passive: true});
  window.addEventListener('resize', scheduleReading);
  window.addEventListener('load', scheduleReading);
  refreshReading();
  for (const link of document.querySelectorAll('.contents a')) {
    link.addEventListener('click', event => {
      if (link.closest('summary')) link.closest('details').open = true;
      if (mobile.matches) showMobileMenu(false);
      event.stopPropagation();
    });
  }

  const viewer = byId('viewer');
  const image = byId('viewer-image');
  const stage = byId('viewer-stage');
  const field = byId('slide-number');
  const sizeButton = byId('viewer-size');
  const total = Number(body.dataset.slideCount);
  let page = 1;
  let returnTo = null;
  function showSlide(number) {
    page = Math.max(1, Math.min(total, number));
    image.src = 'slides/' + String(page).padStart(3, '0') + '.webp';
    const heading = byId('slide-' + page)?.querySelector('.lesson-head h3,.lesson-head h4')?.textContent;
    image.alt = heading ? '第 ' + page + ' 張，' + heading : '第 ' + page + ' 張投影片';
    byId('viewer-count').textContent = page + ' / ' + total;
    field.value = page;
    byId('prev-slide').disabled = page === 1;
    byId('next-slide').disabled = page === total;
    stage.scrollTo(0, 0);
  }
  for (const link of document.querySelectorAll('a.zoom')) {
    link.addEventListener('click', event => {
      if (typeof viewer.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnTo = link;
      showSlide(Number(link.dataset.page));
      viewer.showModal();
      byId('viewer-close').focus();
    });
  }
  const change = delta => showSlide(page + delta);
  byId('prev-slide').addEventListener('click', () => change(-1));
  byId('next-slide').addEventListener('click', () => change(1));
  field.addEventListener('change', () => showSlide(Number.isFinite(field.valueAsNumber) ? Math.round(field.valueAsNumber) : page));
  byId('viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    setZoom(false);
    returnTo?.focus({preventScroll: true});
  });
  function setZoom(zoomed) {
    stage.classList.toggle('zoomed', zoomed);
    sizeButton.textContent = zoomed ? '縮回' : '放大';
    sizeButton.setAttribute('aria-pressed', String(zoomed));
    stage.scrollTo(0, 0);
  }
  sizeButton.addEventListener('click', () => setZoom(!stage.classList.contains('zoomed')));
  document.addEventListener('keydown', event => {
    if (viewer.open && event.target !== field) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        change(event.key === 'ArrowLeft' ? -1 : 1);
      }
    } else if (event.key === 'Escape' && body.classList.contains('menu-open')) {
      showMobileMenu(false, true);
    }
  });
})();

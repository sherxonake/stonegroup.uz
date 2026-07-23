(() => {
  const header = document.getElementById('header');
  const progressBar = document.getElementById('progressBar');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  const onScroll = () => {
    header.classList.toggle('is-scrolled', scrollY > 10);
    const h = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) setMenu(false);
  });

  // reveal on scroll
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // animated counters
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const animateCount = el => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const plain = el.dataset.plain;
    const dur = 1400;
    let t0;
    const step = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      const val = Math.round(easeOut(p) * target);
      el.textContent = (plain ? val : val.toLocaleString('ru-RU')) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const ioCount = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting) {
        animateCount(en.target);
        ioCount.unobserve(en.target);
      }
    }
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat__num').forEach(el => ioCount.observe(el));

  // single-open accordion per group
  for (const groupSel of ['#servicesAcc', '.faq']) {
    const group = document.querySelector(groupSel);
    if (!group) continue;
    group.addEventListener('toggle', e => {
      if (e.target.open) {
        group.querySelectorAll('details[open]').forEach(d => {
          if (d !== e.target) d.open = false;
        });
      }
    }, true);
  }

  // lead form → open user's messenger with prefilled text
  const form = document.getElementById('leadForm');
  const ok = document.getElementById('formOk');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    if (!String(f.get('phone') || '').trim()) {
      form.querySelector('[name="phone"]').focus();
      return;
    }
    const lines = [
      'Yangi ariza — stonegroup.uz',
      'Ism: ' + (f.get('name') || '—'),
      'Telefon: ' + f.get('phone'),
      'Kompaniya: ' + (f.get('company') || '—'),
      'Xizmat: ' + (f.get('service') || '—'),
      'Muhit: ' + (f.get('env') || '—'),
      'Xabar: ' + (f.get('msg') || '—'),
    ].join('\n');
    location.href = 'mailto:constructionstonegroup@inbox.ru?subject=' +
      encodeURIComponent('Yangi ariza — stonegroup.uz') +
      '&body=' + encodeURIComponent(lines);
    ok.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();

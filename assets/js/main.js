(() => {
  const doc = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const header = document.getElementById('header');
  const progressBar = document.getElementById('progressBar');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const loader = document.getElementById('loader');

  /* ---------- text splitting ---------- */
  const wrapHeroLines = () => {
    document.querySelectorAll('.hero__line').forEach((line, i) => {
      const li = document.createElement('span');
      li.className = 'li';
      li.style.setProperty('--l', i);
      while (line.firstChild) li.appendChild(line.firstChild);
      line.appendChild(li);
    });
  };
  wrapHeroLines();

  const splitWords = el => {
    const walk = node => {
      if (node.nodeType === 3) {
        if (!node.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const wm = document.createElement('span');
          wm.className = 'wm';
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = part;
          wm.appendChild(wi);
          frag.appendChild(wm);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        [...node.childNodes].forEach(walk);
      }
    };
    [...el.childNodes].forEach(walk);
    el.querySelectorAll('.wi').forEach((w, i) => w.style.setProperty('--wi', i));
  };
  const splitHeadings = () => {
    if (!reduced) document.querySelectorAll('.section__head h2, .cta__text h2').forEach(splitWords);
  };
  splitHeadings();

  window.__psgResplit = () => {
    wrapHeroLines();
    splitHeadings();
  };

  /* ---------- observers (started after loader) ---------- */
  const startObservers = () => {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    document.querySelectorAll('.reveal, .section__head h2, .cta__text h2, .footer__giant').forEach(el => io.observe(el));

    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const animateCount = el => {
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const plain = el.dataset.plain;
      let t0;
      const step = ts => {
        if (!t0) t0 = ts;
        const p = Math.min((ts - t0) / 1400, 1);
        const val = Math.round(easeOut(p) * target);
        el.textContent = (plain ? val : val.toLocaleString('ru-RU')) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const ioCount = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (en.isIntersecting) { animateCount(en.target); ioCount.unobserve(en.target); }
      }
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat__num').forEach(el => ioCount.observe(el));
  };

  /* ---------- preloader ---------- */
  const finishLoader = () => {
    if (!loader || loader.classList.contains('done')) return;
    doc.classList.add('ready');
    loader.classList.add('done');
    document.body.classList.remove('lock');
    startObservers();
    setTimeout(() => loader.remove(), 900);
  };
  if (reduced || !loader) {
    if (loader) loader.remove();
    doc.classList.add('ready');
    startObservers();
  } else {
    document.body.classList.add('lock');
    const bar = document.getElementById('loaderBar');
    const pct = document.getElementById('loaderPct');
    let t0;
    const tick = ts => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 1150, 1);
      const e = 1 - Math.pow(1 - p, 2.2);
      const v = Math.round(e * 100);
      bar.style.width = v + '%';
      pct.textContent = String(v).padStart(2, '0') + ' %';
      if (p < 1) requestAnimationFrame(tick);
      else finishLoader();
    };
    requestAnimationFrame(tick);
    setTimeout(finishLoader, 3000);
  }

  /* ---------- header: progress, glass, hide-on-scroll ---------- */
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    if (!header.classList.contains('menu-open')) {
      if (y > 160 && y > lastY + 6) header.classList.add('header--hidden');
      else if (y < lastY - 6 || y <= 160) header.classList.remove('header--hidden');
    }
    lastY = y;
    const h = doc.scrollHeight - innerHeight;
    progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    if (open) header.classList.remove('header--hidden');
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- hero parallax (scroll + mouse) ---------- */
  const heroImg = document.querySelector('.hero__bg img');
  const heroIn = document.querySelector('.hero__in');
  if (!reduced && heroImg) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    if (finePointer) {
      document.querySelector('.hero').addEventListener('pointermove', e => {
        mx = (e.clientX / innerWidth - .5) * -14;
        my = (e.clientY / innerHeight - .5) * -10;
      });
    }
    const loop = () => {
      cx += (mx - cx) * .06;
      cy += (my - cy) * .06;
      const y = Math.min(scrollY, innerHeight * 1.2);
      heroImg.style.transform = `translate3d(${cx}px, ${y * .16 + cy}px, 0) scale(1.08)`;
      if (heroIn) heroIn.style.transform = `translate3d(${cx * -.35}px, ${cy * -.35}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- custom cursor + magnetic + tilt (desktop only) ---------- */
  if (finePointer && !reduced) {
    doc.classList.add('has-cursor');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    let px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py;
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
    const cursorLoop = () => {
      rx += (px - rx) * .18;
      ry += (py - ry) * .18;
      dot.style.transform = `translate(${px - 3}px, ${py - 3}px)`;
      ring.style.transform = `translate(${rx - ring.offsetWidth / 2}px, ${ry - ring.offsetHeight / 2}px)`;
      requestAnimationFrame(cursorLoop);
    };
    requestAnimationFrame(cursorLoop);

    document.addEventListener('pointerover', e => {
      const gal = e.target.closest('.gallery__item');
      const link = e.target.closest('a, button, summary, .gallery__item');
      ring.classList.toggle('is-view', !!gal);
      ring.classList.toggle('is-link', !!link && !gal);
      label.textContent = gal ? '+' : '';
    });

    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * .22;
        const dy = (e.clientY - r.top - r.height / 2) * .35;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    document.querySelectorAll('.why__card, .ind').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const ry2 = ((e.clientX - r.left) / r.width - .5) * 8;
        const rx2 = ((e.clientY - r.top) / r.height - .5) * -7;
        card.style.transform = `perspective(700px) rotateX(${rx2}deg) rotateY(${ry2}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- accordions: single open per group ---------- */
  for (const groupSel of ['#servicesAcc', '.faq']) {
    const group = document.querySelector(groupSel);
    if (!group) continue;
    group.addEventListener('toggle', e => {
      if (e.target.open) {
        group.querySelectorAll('details[open]').forEach(d => { if (d !== e.target) d.open = false; });
      }
    }, true);
  }

  /* ---------- gallery: category filter ---------- */
  const galItems = [...document.querySelectorAll('.gallery__item')];
  const galFilter = document.getElementById('galFilter');
  let activeCat = 'all';

  const applyFilter = cat => {
    activeCat = cat;
    let shown = 0;
    galItems.forEach(fig => {
      const match = cat === 'all' || fig.dataset.cat === cat;
      fig.hidden = !match;
      fig.classList.remove('is-filtering');
      if (match) {
        fig.style.setProperty('--gi', shown++);
        if (!reduced) {
          void fig.offsetWidth;
          fig.classList.add('is-filtering');
        }
      }
    });
    galFilter.querySelectorAll('.gal-chip').forEach(chip => {
      const on = chip.dataset.filter === cat;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  };

  galFilter.addEventListener('click', e => {
    const chip = e.target.closest('.gal-chip');
    if (chip && chip.dataset.filter !== activeCat) applyFilter(chip.dataset.filter);
  });

  /* ---------- gallery lightbox ---------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCap');
  const lbCount = document.getElementById('lightboxCount');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  let lbList = [];
  let lbIndex = 0;

  const showAt = i => {
    lbIndex = (i + lbList.length) % lbList.length;
    const fig = lbList[lbIndex];
    const img = fig.querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = fig.querySelector('figcaption').textContent;
    lbCount.textContent = (lbIndex + 1) + ' / ' + lbList.length;
    const solo = lbList.length < 2;
    lbPrev.hidden = solo;
    lbNext.hidden = solo;
  };

  const closeLb = () => {
    lb.classList.remove('open');
    setTimeout(() => { lb.hidden = true; }, 350);
  };

  galItems.forEach(fig => {
    fig.addEventListener('click', () => {
      lbList = galItems.filter(f => !f.hidden);
      showAt(lbList.indexOf(fig));
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('open'));
    });
  });

  lb.addEventListener('click', e => { if (!e.target.closest('figure, .lightbox__nav')) closeLb(); });
  document.getElementById('lightboxClose').addEventListener('click', closeLb);
  lbPrev.addEventListener('click', () => showAt(lbIndex - 1));
  lbNext.addEventListener('click', () => showAt(lbIndex + 1));
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') showAt(lbIndex - 1);
    else if (e.key === 'ArrowRight') showAt(lbIndex + 1);
  });

  /* ---------- lead form → mailto ---------- */
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

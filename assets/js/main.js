/* Okutala Etosha Lodge, v4. Plain JS + Lenis (inlined above) for the smooth scroll. Works offline. */
(function () {
  'use strict';

  var CONFIG = {
    NIGHTSBRIDGE_URL: 'https://book.nightsbridge.com/18987?lang=en',
    ENQUIRY_TO: 'reservations@okutala.com'
  };

  // Each photo is stored once in the file; copies point at it with data-ref
  document.querySelectorAll('img[data-ref]').forEach(function (img) {
    var src = document.querySelector('img[data-k="' + img.getAttribute('data-ref') + '"]');
    if (src) img.src = src.getAttribute('src');
  });

  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  doc.classList.add('js');
  function clamp(v, a, b) { a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }

  /* ---------- Review-only: headings serif or Aptos (always opens on serif) ---------- */
  var typeHint = function () {};
  (function () {
    var t = document.getElementById('typeToggle'); if (!t) return;
    var hint = document.getElementById('ttHint'), hintTimer = null;
    function set(v) {
      if (v === 'aptos') doc.setAttribute('data-type', 'aptos'); else doc.removeAttribute('data-type');
      t.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
      if (lenis) lenis.resize();
    }
    function dismiss() { t.classList.remove('is-hinting'); clearTimeout(hintTimer); }
    set('serif');
    t.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { set(b.getAttribute('data-v')); dismiss(); } });
    // once per visit: a gentle nudge so the client notices the choice
    typeHint = function () {
      var shown = false; try { shown = sessionStorage.getItem('okt-type-hint') === '1'; } catch (e) {}
      if (shown) return;
      try { sessionStorage.setItem('okt-type-hint', '1'); } catch (e) {}
      setTimeout(function () { t.classList.add('is-hinting'); hintTimer = setTimeout(dismiss, 9000); }, 1400);
    };
    hint.addEventListener('click', dismiss);
  })();

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.95, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    window.okutalaScroll = lenis;
  }
  var EASE = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  function scrollToEl(el, immediate) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.8, easing: EASE, immediate: !!immediate, force: true });
    else el.scrollIntoView({ behavior: immediate ? 'instant' : 'smooth' });
  }
  function toTop() { if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); }
  function lockScroll(on) { if (lenis) { on ? lenis.stop() : lenis.start(); } }

  /* ---------- Split headings into words that rise in ---------- */
  function split(el, base) {
    if (el.getAttribute('data-split')) return;
    el.setAttribute('data-split', '1'); el.classList.add('split');
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            i.style.setProperty('--wd', ((base || 0) + n * 0.06).toFixed(2));
            w.appendChild(i); frag.appendChild(w); n++;
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(el);
  }
  if (!reduce) {
    document.querySelectorAll('.hero h1, .sec-head h2, .r-title, .r-cta-box h2, .contact-copy h2, .gtk-head h3, .wte-feature-text h3, .j-intro h3, .rx-box h2').forEach(function (h) {
      split(h, h.closest('.hero') ? 0.15 : 0);
      var r = h.closest('.reveal'); if (r && r.firstElementChild && (r.contains(h))) { /* parent fade handled separately */ }
    });
  }

  /* ---------- Image masks: unmask + slow zoom out ---------- */
  document.querySelectorAll('.lodge-photo, .wte-feature-photo, .wte-banner, .xi-frame').forEach(function (m) { m.classList.add('mask'); });
  document.querySelectorAll('.xi-frame').forEach(function (m) { m.classList.add('no-hover'); });
  document.querySelectorAll('.gallery .g').forEach(function (g, i) { g.style.setProperty('--gi', i % 6); });

  /* ---------- Header: clear at the top, hides going down, frosted coming back up ---------- */
  var header = document.querySelector('.site-header');
  var darkZones = document.querySelectorAll('.section-dark, .footer, .r-hero, .hero');
  var lastY = 0, menuOpen = false;
  function onScroll() {
    var y = window.scrollY, probe = 40, inDark = false;
    darkZones.forEach(function (z) { var r = z.getBoundingClientRect(); if (r.height && r.top <= probe && r.bottom > probe) inDark = true; });
    var scrolled = y > 80;
    header.classList.toggle('is-dark', scrolled && inDark);
    header.classList.toggle('is-solid', scrolled && !inDark);
    var down = y > lastY + 2, up = y < lastY - 2;
    if (!menuOpen) {
      if (down && y > window.innerHeight * 0.6) header.classList.add('is-hidden');
      else if (up || y < 80) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    lockScroll(open);
    if (open) header.classList.remove('is-hidden');
  }
  btn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeLb(); } });

  // Booking links
  if (CONFIG.NIGHTSBRIDGE_URL) {
    document.querySelectorAll('[data-book]').forEach(function (a) { a.href = CONFIG.NIGHTSBRIDGE_URL; a.target = '_blank'; a.rel = 'noopener'; });
  }

  /* ---------- Hero: slow cross-fade with drift ---------- */
  var slides = document.querySelectorAll('.hero .slide');
  if (slides.length > 1 && !reduce) {
    var si = 0;
    setInterval(function () {
      if (document.hidden) return;
      slides[si].classList.remove('is-on');
      si = (si + 1) % slides.length;
      slides[si].classList.add('is-on');
    }, 8000);
  }

  /* ---------- Reveal on scroll ---------- */
  var revealSel = '.reveal, .split, .mask, .gallery, .foot-icon, .eyebrow';
  var io = null;
  function observeAll(root) {
    var els = (root || document).querySelectorAll(revealSel);
    if (!io) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    els.forEach(function (el) {
      if (el.classList.contains('in')) return;
      if (el.matches('.mask, .foot-icon')) { var p = el.parentElement, l = proxy.get(p) || []; l.push(el); proxy.set(p, l); io.observe(p); }
      else io.observe(el);
    });
  }
  // clipped elements are watched through their parent (a fully clipped box never "intersects")
  var proxy = new Map();
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var list = proxy.get(en.target);
        if (list) { list.forEach(function (el) { el.classList.add('in'); }); proxy.delete(en.target); }
        if (!list || en.target.matches(revealSel)) en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  }
  // A reveal that contains a split heading lets the words do the work
  document.querySelectorAll('.reveal').forEach(function (r) { if (r.matches('.split') ) r.classList.add('has-split'); });
  // Stagger siblings revealed together
  document.querySelectorAll('.wte-tiles, .j-intro, .j-steps, .lodge-grid').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--d', (i % 4) * 0.12 + 's'); });
  });

  // Stay cards rise one after another, then switch to their hover transitions
  var rise = document.querySelectorAll('.rise');
  var io2 = null;
  if ('IntersectionObserver' in window && !reduce) {
    io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; el.classList.add('in'); io2.unobserve(el);
        setTimeout(function () { el.classList.add('settled'); }, 2200);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  }
  function observeRise(root) {
    (root || document).querySelectorAll('.rise').forEach(function (el) {
      if (io2) io2.observe(el); else { el.classList.add('in'); el.classList.add('settled'); }
    });
  }

  /* ---------- Parallax: photos drift slower than the page ---------- */
  var plx = [];
  function addPlx(el, speed, scaleTo) { if (el) plx.push({ el: el, s: speed, z: scaleTo || 0 }); }
  if (!reduce) {
    addPlx(document.querySelector('.hero-slides'), 0.32);
    document.querySelectorAll('.r-hero-img').forEach(function (im) { addPlx(im, 0.32); });
    addPlx(document.querySelector('.j-banner-img'), 0.22);
    document.querySelectorAll('.wte-feature-photo img, .wte-banner img, .lodge-photo img').forEach(function (im) { addPlx(im, -0.08); });
  }
  var heroCopy = document.querySelector('.hero-copy');
  var heroCue = document.querySelector('.hero-cue');
  function parallax() {
    var vh = window.innerHeight;
    plx.forEach(function (p) {
      var host = p.el.parentElement, r = host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var y;
      if (p.s > 0.2) y = -r.top * p.s; // heroes: move with the top of the section
      else y = ((r.top + r.height / 2) - vh / 2) * p.s;
      p.el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
    if (heroCopy && !document.getElementById('home').hidden) {
      var hy = window.scrollY, k = clamp(hy / (vh * 0.8));
      heroCopy.style.transform = 'translateY(' + (hy * 0.18).toFixed(1) + 'px)';
      heroCopy.style.opacity = (1 - k * 1.1).toFixed(3);
      if (heroCue) heroCue.style.opacity = (1 - k * 4).toFixed(3);
    }
  }
  if (!reduce) {
    var ptick = false;
    window.addEventListener('scroll', function () { if (!ptick) { ptick = true; requestAnimationFrame(function () { ptick = false; parallax(); }); } }, { passive: true });
    window.addEventListener('resize', parallax);
    parallax();
  }

  /* ---------- Curtain: intro and page changes ---------- */
  var curtain = document.getElementById('curtain');
  function curtainTo(fn) {
    if (reduce || !curtain) { fn(); return; }
    lockScroll(true);
    // reset the line to 0 while the curtain is still out of sight (no transition, so it never runs backwards)
    curtain.classList.remove('is-lift', 'show-mark', 'is-intro');
    void curtain.offsetWidth;
    curtain.classList.add('is-cover');
    setTimeout(function () {
      void curtain.offsetWidth;
      curtain.classList.add('show-mark');   // line draws 0 to 100, left to right
      fn();
      setTimeout(function () {
        curtain.classList.remove('is-cover');
        curtain.classList.add('is-lift');
        lockScroll(false);
      }, 1450);
    }, 950);
  }

  /* ---------- Room pages (#/suites etc.) ---------- */
  var roomSelect = document.querySelector('#enquiry select[name=room]');
  document.querySelectorAll('[data-room]').forEach(function (a) {
    a.addEventListener('click', function () { if (roomSelect) roomSelect.value = a.getAttribute('data-room'); });
  });
  var home = document.getElementById('home');
  var pages = document.querySelectorAll('.room-page');
  var homeTitle = document.title;
  function resetReveals(root) {
    root.querySelectorAll('.in').forEach(function (el) { if (el.matches(revealSel + ', .rise')) el.classList.remove('in', 'settled'); });
    observeAll(root); observeRise(root);
  }
  function route() {
    var h = location.hash;
    var page = h.indexOf('#/') === 0 ? document.getElementById('room-' + h.slice(2)) : null;
    if (page) {
      home.hidden = true;
      pages.forEach(function (p) { p.hidden = p !== page; });
      document.title = page.querySelector('.r-title').textContent + ' | Okutala Etosha Lodge';
      toTop(); resetReveals(page);
      header.classList.remove('is-hidden'); lastY = 0; onScroll(); parallax && parallax();
      if (lenis) lenis.resize();
      return;
    }
    if (home.hidden) {
      pages.forEach(function (p) { p.hidden = true; });
      home.hidden = false;
      document.title = homeTitle;
      if (lenis) lenis.resize();
      var target = h && h.length > 1 ? document.getElementById(h.slice(1)) : null;
      if (target && target !== header) scrollToEl(target, true); else toTop();
      header.classList.remove('is-hidden'); onScroll(); parallax && parallax();
    }
  }
  var lastIsPage = location.hash.indexOf('#/') === 0;
  window.addEventListener('hashchange', function () {
    var isPage = location.hash.indexOf('#/') === 0;
    var switching = isPage || lastIsPage;
    lastIsPage = isPage;
    if (switching) curtainTo(route); else route();
  });

  // In-page links glide (and leave a room page through the curtain)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var href = a.getAttribute('href');
    if (nav.contains(a)) setMenu(false);
    if (href.indexOf('#/') === 0) return; // room pages: hashchange handles it
    var id = href.slice(1), target = id ? document.getElementById(id) : null;
    if (href === '#top' || id === 'top') target = null;
    e.preventDefault();
    if (home.hidden) { // from a room page back to a home section
      lastIsPage = false;
      curtainTo(function () { history.pushState(null, '', href === '#top' ? location.pathname : href); route(); });
      return;
    }
    history.pushState(null, '', href === '#top' ? location.pathname + location.search : href);
    if (target) scrollToEl(target); else if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: EASE }); else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Accordions: one open at a time, photo beside follows ---------- */
  function setPanel(item, open) {
    var b = item.querySelector('.acc-btn');
    var panel = item.querySelector('.acc-panel');
    if ((b.getAttribute('aria-expanded') === 'true') === open) return;
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('open', open);
    if (reduce) { panel.hidden = !open; return; }
    // set the start height, force a layout, then set the end height, so every panel eases the same way
    if (open) {
      panel.hidden = false; panel.style.height = '0px';
      void panel.offsetHeight;
      panel.style.height = panel.scrollHeight + 'px';
    } else {
      panel.style.height = panel.scrollHeight + 'px';
      void panel.offsetHeight;
      panel.style.height = '0px';
    }
    panel.addEventListener('transitionend', function end(e) {
      if (e.propertyName !== 'height') return;
      panel.removeEventListener('transitionend', end);
      if (b.getAttribute('aria-expanded') === 'true') panel.style.height = ''; else panel.hidden = true;
      if (lenis) lenis.resize();
    });
  }
  document.querySelectorAll('.acc').forEach(function (acc) {
    var page = acc.closest('.room-page') || acc;
    var imgs = page.querySelectorAll('.ri-img');
    function show(key) { imgs.forEach(function (im, i) { im.classList.toggle('active', key ? im.getAttribute('data-show') === key : i === 0); }); }
    acc.querySelectorAll('.acc-item').forEach(function (item) {
      item.querySelector('.acc-btn').addEventListener('click', function () {
        var opening = !item.classList.contains('open');
        acc.querySelectorAll('.acc-item').forEach(function (o) { if (o !== item) setPanel(o, false); });
        setPanel(item, opening);
        show(opening ? item.getAttribute('data-img') : null);
      });
    });
  });

  /* ---------- Room photo slider: drag, progress line, slow autoplay ---------- */
  document.querySelectorAll('.r-gallery').forEach(function (g) {
    var track = g.querySelector('.rg-track');
    var bar = g.querySelector('.rg-bar span');
    track.setAttribute('data-cursor', 'Drag');
    track.setAttribute('data-lenis-prevent-touch', '');
    function update() {
      var ratio = track.clientWidth / track.scrollWidth;
      var max = track.scrollWidth - track.clientWidth;
      bar.style.width = (ratio * 100) + '%';
      bar.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * (1 / ratio - 1) * 100 : 0) + '%)';
    }
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (window.ResizeObserver) new ResizeObserver(update).observe(track);
    var paused = false, down = null, vel = 0, lastX = 0;
    g.addEventListener('pointerenter', function () { paused = true; });
    g.addEventListener('pointerleave', function () { paused = false; });
    track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = { x: e.clientX, left: track.scrollLeft }; lastX = e.clientX; vel = 0; track.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) { if (down) { track.scrollLeft = down.left - (e.clientX - down.x); vel = e.clientX - lastX; lastX = e.clientX; } });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = null;
      var v = vel * 14; // a little glide after letting go
      track.scrollTo({ left: track.scrollLeft - v, behavior: 'smooth' });
      setTimeout(function () { track.classList.remove('dragging'); }, 500);
    });
    if (!reduce) {
      setInterval(function () {
        if (paused || g.closest('.room-page').hidden || document.hidden) return;
        var slide = track.querySelector('.rg-slide');
        var step = slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
        var atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
      }, 4200);
    }
  });

  /* ---------- Activities on room pages: thumbnails swap the large photo ---------- */
  document.querySelectorAll('.r-exp').forEach(function (x) {
    var thumbs = x.querySelectorAll('.rx-thumb'), bigs = x.querySelectorAll('.rx-big');
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        var i = t.getAttribute('data-i');
        thumbs.forEach(function (o) { o.classList.toggle('active', o === t); });
        bigs.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-i') === i); });
      });
    });
  });

  /* ---------- Activities: the photo follows the activity being read ---------- */
  document.querySelectorAll('.xi').forEach(function (xi) {
    var items = xi.querySelectorAll('.xi-item'), photos = xi.querySelectorAll('.xi-photo');
    var frame = xi.querySelector('.xi-frame');
    var count = document.createElement('p'); count.className = 'xi-count';
    if (frame) frame.appendChild(count);
    function show(i) {
      items.forEach(function (it) { it.classList.toggle('active', it.getAttribute('data-i') === i); });
      photos.forEach(function (ph) { ph.classList.toggle('active', ph.getAttribute('data-i') === i); });
      var t = xi.querySelector('.xi-item[data-i="' + i + '"] h3');
      count.innerHTML = '<b>0' + (+i + 1) + '</b> / 0' + items.length;
    }
    show('0');
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { show(it.getAttribute('data-i')); });
      it.addEventListener('focus', function () { show(it.getAttribute('data-i')); });
    });
    if ('IntersectionObserver' in window) {
      var io3 = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) show(e.target.getAttribute('data-i')); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      items.forEach(function (it) { io3.observe(it); });
    }
  });

  /* ---------- Getting to Okutala: the line draws, the drive traces to the lodge ---------- */
  (function () {
    var jour = document.querySelector('.journey');
    if (!jour) return;
    var banner = jour.querySelector('.j-banner'), map = jour.querySelector('.j-map');
    var road = document.getElementById('mRoad'), eto = document.getElementById('mEtosha'), mover = document.getElementById('mMover');
    var cards = jour.querySelectorAll('.j-card');
    var len = road.getTotalLength();
    function setDrive(p) {
      var d = clamp(p / .65);
      road.style.strokeDasharray = len; road.style.strokeDashoffset = (len * (1 - d)).toFixed(1);
      var q = road.getPointAtLength(d * len);
      mover.setAttribute('cx', q.x); mover.setAttribute('cy', q.y);
      mover.style.opacity = d > 0 && d < 1 ? 1 : 0;
      eto.style.opacity = clamp((p - .65) / .15).toFixed(2);
      cards.forEach(function (c, i) { c.style.setProperty('--card', clamp((p - (.15 + i * .2)) / .15).toFixed(2)); });
    }
    if (reduce) { setDrive(1); banner.style.setProperty('--draw', 1); return; }
    var pin = window.matchMedia('(min-width: 1025px)');
    function mode() { doc.classList.toggle('js-motion', pin.matches); if (lenis) lenis.resize(); }
    mode(); pin.addEventListener('change', mode);
    setDrive(0);
    var played = false, smooth = 0, target = 0;
    function tick() {
      var vh = window.innerHeight;
      var b = banner.getBoundingClientRect();
      banner.style.setProperty('--draw', clamp((vh * .75 - b.top) / (b.height * .8)).toFixed(3));
      if (pin.matches) {
        var r = map.getBoundingClientRect();
        setDrive(clamp(-r.top / (r.height - vh)));
      } else if (!played && map.getBoundingClientRect().top < vh * .7) {
        played = true;
        var t0 = performance.now();
        (function step(now) { var p = clamp((now - t0) / 2800); setDrive(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(step); })(t0);
      }
    }
    var ticking = false;
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; tick(); }); } }, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  })();

  // Directions: "Read more" on the two story blocks
  document.querySelectorAll('.j-more-btn').forEach(function (b) {
    var box = b.previousElementSibling;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.classList.toggle('is-open', open);
      box.style.maxHeight = open ? box.scrollHeight + 'px' : '';
      b.firstChild.textContent = open ? 'Read less ' : 'Read more ';
      setTimeout(function () { if (lenis) lenis.resize(); }, 1150);
    });
  });
  // Directions blocks (<details>): animate open and close with the same ease as the other panels
  var ACC_MS = 900, ACC_EASE = 'cubic-bezier(.76, 0, .24, 1)';
  document.querySelectorAll('.j-step').forEach(function (d) {
    var sum = d.querySelector('summary'), anim = null;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (reduce || !d.animate) { d.open = !d.open; if (lenis) lenis.resize(); return; }
      var start = d.offsetHeight, closing = d.open && !d.classList.contains('is-closing');
      if (anim) anim.cancel();
      d.style.overflow = 'hidden';
      var end;
      if (closing) { d.classList.add('is-closing'); end = sum.offsetHeight; }
      else { d.classList.remove('is-closing'); d.open = true; end = d.scrollHeight; }
      anim = d.animate({ height: [start + 'px', end + 'px'] }, { duration: ACC_MS, easing: ACC_EASE });
      anim.onfinish = function () {
        anim = null; d.style.overflow = '';
        if (d.classList.contains('is-closing')) { d.open = false; d.classList.remove('is-closing'); }
        if (lenis) lenis.resize();
      };
    });
  });

  // Practical blocks fold away on phones
  if (window.matchMedia('(max-width: 760px)').matches) {
    document.querySelectorAll('.j-step').forEach(function (d) { d.open = false; });
  }

  /* ---------- Lightbox: fade, scale, previous / next ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var gs = Array.prototype.slice.call(document.querySelectorAll('.g'));
  var lbI = 0;
  var lbCount = document.createElement('p'); lbCount.className = 'lb-count'; lb.appendChild(lbCount);
  ['prev', 'next'].forEach(function (k) {
    var b = document.createElement('button'); b.className = 'lb-nav lb-' + k; b.type = 'button';
    b.setAttribute('aria-label', k === 'prev' ? 'Previous photo' : 'Next photo');
    b.innerHTML = k === 'prev' ? '&larr;' : '&rarr;';
    b.addEventListener('click', function (e) { e.stopPropagation(); lbShow(lbI + (k === 'prev' ? -1 : 1)); });
    lb.appendChild(b);
  });
  function lbShow(i) {
    lbI = (i + gs.length) % gs.length;
    var src = gs[lbI].querySelector('img');
    lbImg.classList.remove('is-in');
    setTimeout(function () {
      lbImg.src = src.src; lbImg.alt = src.alt;
      lbCount.textContent = (lbI + 1 < 10 ? '0' : '') + (lbI + 1) + ' / ' + (gs.length < 10 ? '0' : '') + gs.length;
      requestAnimationFrame(function () { lbImg.classList.add('is-in'); });
    }, lb.classList.contains('is-open') ? 300 : 0);
  }
  function openLb(i) { lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('is-open'); }); lbShow(i); lockScroll(true); }
  function closeLb() { if (!lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); lbImg.classList.remove('is-in'); lockScroll(false); setTimeout(function () { lb.hidden = true; }, 800); }
  window.closeLb = closeLb;
  gs.forEach(function (g, i) { g.setAttribute('data-cursor', 'View'); g.addEventListener('click', function () { openLb(i); }); });
  document.getElementById('lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') lbShow(lbI + 1);
    if (e.key === 'ArrowLeft') lbShow(lbI - 1);
  });

  /* ---------- Cursor: a soft disc that names the action ---------- */
  (function () {
    var c = document.getElementById('cursor'); if (!c || !fine || reduce) return;
    var label = c.querySelector('span');
    document.querySelectorAll('.stay-card').forEach(function (s) { s.setAttribute('data-cursor', 'Explore'); });
    var x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor]');
      if (t && !e.target.closest('.btn')) { label.textContent = t.getAttribute('data-cursor'); c.classList.add('is-on'); }
      else c.classList.remove('is-on');
    });
    document.addEventListener('pointerleave', function () { c.classList.remove('is-on'); });
    (function loop() { cx += (x - cx) * 0.16; cy += (y - cy) * 0.16; c.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; requestAnimationFrame(loop); })();
    // stay cards: clicking anywhere opens the room
    document.querySelectorAll('.stay-card').forEach(function (s) {
      s.addEventListener('click', function (e) { if (!e.target.closest('a')) { var a = s.querySelector('a.btn'); if (a) location.hash = a.getAttribute('href').slice(1); } });
    });
  })();

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry');
  var note = document.getElementById('formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (!d.get('name') || !/.+@.+\..+/.test(d.get('email') || '')) { note.textContent = 'Please add your name and a valid email address.'; return; }
    var body = [
      'Name: ' + d.get('name'), 'Email: ' + d.get('email'),
      'Arrival: ' + (d.get('arrival') || 'not set'), 'Departure: ' + (d.get('departure') || 'not set'),
      'Guests: ' + (d.get('guests') || 'not set'), 'Interest: ' + (d.get('room') || 'not sure yet'),
      '', d.get('message') || ''
    ].join('\n');
    note.textContent = 'Opening your email app to send this enquiry.';
    window.location.href = 'mailto:' + CONFIG.ENQUIRY_TO + '?subject=' + encodeURIComponent('Website enquiry from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
  });

  /* ---------- Start: route, then the intro curtain lifts on the hero ---------- */
  var hero = document.querySelector('.hero');
  var heroParts = hero ? hero.querySelectorAll('.split, .reveal, .eyebrow') : [];
  function startPage() {
    observeAll(document); observeRise(document);
  }
  var firstIsPage = location.hash.indexOf('#/') === 0;
  if (firstIsPage) { var hh = location.hash; home.hidden = true; route(); }
  else if (location.hash.length > 1) { setTimeout(function () { var t = document.getElementById(location.hash.slice(1)); if (t) scrollToEl(t, true); }, 50); }

  var seen = false; try { seen = sessionStorage.getItem('okt-intro') === '1'; } catch (e) {}
  if (reduce || !curtain || seen || firstIsPage) {
    if (curtain) curtain.classList.remove('is-intro');
    startPage(); typeHint();
  } else {
    // hold the hero back until the curtain lifts
    lockScroll(true);
    setTimeout(function () { curtain.classList.add('show-mark'); }, 200);
    setTimeout(function () {
      curtain.classList.remove('is-intro'); curtain.classList.add('is-lift');
      lockScroll(false); startPage(); typeHint();
      try { sessionStorage.setItem('okt-intro', '1'); } catch (e) {}
    }, 2200);
  }
})();


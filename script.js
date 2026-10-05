/* ═══════════════════════════════════════════════════════════════
   PEST CONTROL MÉXICO — Interacciones y animaciones
   Vanilla JS · sin dependencias · respeta prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WA_NUMBER = '527717129270';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isDesktop = function () { return window.matchMedia('(min-width: 1024px)').matches; };

  /* Cola de tareas que esperan a que termine el loader */
  var ready = false;
  var readyQueue = [];
  function whenReady(fn) { ready ? fn() : readyQueue.push(fn); }
  function setReady() {
    if (ready) return;
    ready = true;
    root.classList.remove('is-loading');
    root.classList.add('is-ready');
    readyQueue.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* noop */ } });
  }

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* ───────────────────────────────
     01. LOADER
     ─────────────────────────────── */
  function initLoader() {
    var loader = $('#loader');
    if (!loader || reduced) { if (loader) loader.classList.add('is-gone'); setReady(); return; }

    root.classList.add('is-loading');
    var arc = $('#loader-arc');
    var pctEl = $('#loader-pct');
    var msgEl = $('#loader-msg');
    var CIRC = 390;
    var MIN_MS = 2300;
    var MAX_MS = 7000;
    var start = performance.now();
    var loaded = doc.readyState === 'complete';
    var fontsOk = !doc.fonts;
    var p = 0;
    var finished = false;
    var msgs = [[0, 'Preparando tu protección'], [32, 'Cargando servicios'], [62, 'Afinando detalles'], [92, 'Todo listo']];
    var lastMsg = -1;

    if (!loaded) window.addEventListener('load', function () { loaded = true; });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { fontsOk = true; });

    function finish() {
      if (finished) return;
      finished = true;
      setTimeout(function () {
        loader.classList.add('is-done');
        setTimeout(setReady, 650);
        setTimeout(function () { loader.classList.add('is-gone'); }, 1700);
      }, 380);
    }

    function tick(now) {
      var el = now - start;
      var timeTarget = clamp(el / MIN_MS, 0, 1) * 100;
      var cap = (loaded && fontsOk) || el > MAX_MS ? 100 : 90;
      var target = Math.min(timeTarget, cap);
      p += (target - p) * 0.1 + 0.12;
      if (p > target) p = target;
      var shown = Math.round(p);
      pctEl.textContent = shown;
      arc.style.strokeDashoffset = CIRC * (1 - p / 100);
      for (var i = msgs.length - 1; i >= 0; i--) {
        if (p >= msgs[i][0]) {
          if (lastMsg !== i) { lastMsg = i; msgEl.textContent = msgs[i][1]; }
          break;
        }
      }
      if (p >= 99.5) { pctEl.textContent = 100; arc.style.strokeDashoffset = 0; finish(); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ───────────────────────────────
     02. TÍTULOS POR PALABRAS
     ─────────────────────────────── */
  function splitWords(el) {
    var idx = 0;
    function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span');
            w.className = 'w';
            var inner = doc.createElement('span');
            inner.className = 'w__in';
            inner.style.setProperty('--i', idx++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    }
    wrap(el);
  }

  /* ───────────────────────────────
     03. REVELADO AL HACER SCROLL
     ─────────────────────────────── */
  function initReveal() {
    var splits = $$('[data-split]');
    splits.forEach(splitWords);

    var targets = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window) || reduced) {
      targets.forEach(function (t) { t.classList.add('is-in'); });
      return;
    }
    function reveal(t) {
      var delay = parseInt(t.getAttribute('data-delay') || '0', 10);
      t.style.setProperty('--d', delay);
      t.classList.add('is-in');
      // Al terminar, se libera el atributo para que vuelvan las transiciones de hover propias del elemento.
      if (t.hasAttribute('data-reveal')) {
        setTimeout(function () {
          t.removeAttribute('data-reveal');
          t.style.removeProperty('--d');
        }, delay + 1700);
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var t = e.target;
        io.unobserve(t);
        // Los elementos con máscara (clip-path) no se pueden observar directamente: se observa su contenedor.
        if (t.__masks) t.__masks.forEach(reveal); else reveal(t);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (t) {
      if (t.getAttribute('data-reveal') === 'mask') {
        var host = t.parentElement;
        if (!host.__masks) { host.__masks = []; io.observe(host); }
        host.__masks.push(t);
      } else {
        io.observe(t);
      }
    });
  }

  /* ───────────────────────────────
     04. CONTADORES
     ─────────────────────────────── */
  function initCounters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function fmt(v, dec, suffix) { return v.toFixed(dec).replace(/\.0+$/, dec ? '.0' : '') + (suffix || ''); }

    function run(el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced) { el.textContent = end.toFixed(dec) + suffix; return; }
      var dur = 1800;
      var t0 = performance.now();
      (function step(now) {
        var k = clamp((now - t0) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - k, 4);
        el.textContent = (end * eased).toFixed(dec) + suffix;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    els.forEach(function (el) {
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (!reduced) el.textContent = (0).toFixed(dec) + (el.getAttribute('data-suffix') || '');
    });

    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        whenReady(function () { run(e.target); });
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ───────────────────────────────
     05. HEADER, MENÚ MÓVIL, PROGRESO
     ─────────────────────────────── */
  var header = $('#header');
  var burger = $('#burger');
  var mnav = $('#mnav');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  function initMenu() {
    if (!burger || !mnav) return;
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && root.classList.contains('menu-open')) setMenu(false); });
  }

  /* ───────────────────────────────
     06. SCROLL (progreso, header, parallax, secciones, pasos)
     ─────────────────────────────── */
  var progressBar = $('#progress');
  var parallaxEls = $$('[data-parallax]');
  var navLinks = $$('.nav__list a');
  var navSections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var stepEls = $$('.step');
  var stepsLine = $('.steps__line');
  var stepsFill = $('#steps-fill');
  var processN = $('#process-n');
  var pImgs = $$('.pimg');
  var lastY = window.scrollY;
  var ticking = false;
  var activeStep = -1;

  function updateSteps(vh) {
    if (!stepEls.length) return;
    var mid = vh * 0.5;
    var best = 0;
    var bestD = Infinity;
    stepEls.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      var d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== activeStep) {
      activeStep = best;
      stepEls.forEach(function (s, i) { s.classList.toggle('is-active', i <= best && i === best); });
      pImgs.forEach(function (im, i) { im.classList.toggle('is-active', i === best); });
      if (processN) processN.textContent = '0' + (best + 1);
    }
    if (stepsLine && stepsFill) {
      var lr = stepsLine.getBoundingClientRect();
      var p = clamp((mid - lr.top) / lr.height, 0, 1);
      stepsFill.style.setProperty('--p', (p * 100).toFixed(1) + '%');
    }
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = doc.documentElement.scrollHeight - vh;

    if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';

    if (header) {
      header.classList.toggle('is-scrolled', y > 12);
      var down = y > lastY + 4;
      var up = y < lastY - 4;
      if (y > 480 && down && !root.classList.contains('menu-open')) header.classList.add('is-hidden');
      else if (up || y < 480) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (!reduced && parallaxEls.length) {
      parallaxEls.forEach(function (img) {
        var frame = img.parentElement;
        var r = frame.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var f = parseFloat(img.getAttribute('data-parallax')) || 0;
        var scale = 1.18;
        var limit = frame.clientHeight * (scale - 1) / 2 - 2;
        var offset = clamp((r.top + r.height / 2 - vh / 2) * f, -limit, limit);
        img.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(' + scale + ')';
      });
    }

    var current = -1;
    navSections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= vh * 0.38) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-current', i === current); });

    updateSteps(vh);
  }
  function requestScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }

  /* ───────────────────────────────
     07. HERO: rotador, estado, tilt, partículas
     ─────────────────────────────── */
  function initRotator() {
    var wrap = $('#rotator');
    if (!wrap) return;
    var words = $$('.rotator__word', wrap);
    var i = 0;
    if (reduced || words.length < 2) return;
    whenReady(function () {
      setInterval(function () {
        if (doc.hidden) return;
        var cur = words[i];
        i = (i + 1) % words.length;
        var nxt = words[i];
        cur.classList.remove('is-active');
        cur.classList.add('is-out');
        cur.setAttribute('aria-hidden', 'true');
        setTimeout(function () { cur.classList.remove('is-out'); }, 1000);
        nxt.classList.remove('is-out');
        nxt.classList.add('is-active');
        nxt.removeAttribute('aria-hidden');
      }, 2700);
    });
  }

  function initStatus() {
    var el = $('#status-text');
    if (!el || reduced) return;
    var states = ['Inspeccionando', 'Identificando plaga', 'Aplicando tratamiento', 'Verificando resultado'];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % states.length;
      el.style.opacity = '0';
      setTimeout(function () { el.textContent = states[i]; el.style.opacity = '1'; }, 220);
    }, 1800);
  }

  function initTilt() {
    var visual = $('.hero__visual');
    var photo = $('[data-tilt]');
    if (!visual || !photo || !finePointer || reduced) return;
    visual.addEventListener('pointermove', function (e) {
      var r = visual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      photo.style.transform = 'rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
    });
    visual.addEventListener('pointerleave', function () { photo.style.transform = ''; });
  }

  function initParticles() {
    var canvas = $('#hero-canvas');
    var hero = $('#inicio');
    if (!canvas || !hero || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, pts = [];
    var mouse = { x: -9999, y: -9999 };
    var visible = true;
    var running = false;
    var LINK = 128;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = clamp(Math.round((w * h) / 17000), 26, 84);
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.34, vy: (Math.random() - 0.5) * 0.34,
          r: Math.random() * 1.9 + 0.9, ph: Math.random() * 6.28, big: Math.random() < 0.12
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, d, al;
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -10) a.x = w + 10; else if (a.x > w + 10) a.x = -10;
        if (a.y < -10) a.y = h + 10; else if (a.y > h + 10) a.y = -10;
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 150 && d > 0.1) { var f = (150 - d) / 150; a.x += (dx / d) * f * 1.6; a.y += (dy / d) * f * 1.6; }
      }
      ctx.lineWidth = 1;
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          b = pts[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            al = (1 - Math.sqrt(d) / LINK) * 0.2;
            ctx.strokeStyle = 'rgba(47,122,10,' + al.toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 170) {
          ctx.strokeStyle = 'rgba(111,177,5,' + ((1 - d / 170) * 0.5).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (i = 0; i < pts.length; i++) {
        a = pts[i];
        var pulse = 0.55 + Math.sin(t / 900 + a.ph) * 0.3;
        ctx.fillStyle = 'rgba(111,177,5,' + pulse.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill();
        if (a.big) {
          ctx.strokeStyle = 'rgba(111,177,5,' + (0.35 - ((t / 40 + a.ph * 20) % 30) / 100).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(a.x, a.y, 4 + ((t / 40 + a.ph * 20) % 30) / 2, 0, 6.2832); ctx.stroke();
        }
      }
    }

    function loop(t) {
      if (!visible || doc.hidden) { running = false; return; }
      draw(t);
      requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 160); });
    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    if (reduced) { draw(0); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(hero);
    }
    doc.addEventListener('visibilitychange', function () { if (!doc.hidden) start(); });
    start();
  }

  /* ───────────────────────────────
     08. EFECTOS DE PUNTERO: spotlight y botones magnéticos
     ─────────────────────────────── */
  function initPointerFx() {
    if (!finePointer) return;
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) * 0.18;
        var y = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.setProperty('--tx', x.toFixed(1) + 'px');
        el.style.setProperty('--ty', y.toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ───────────────────────────────
     09. MARQUEE (bucle continuo sin cortes)
     ─────────────────────────────── */
  function initMarquee() {
    $$('.marquee__row').forEach(function (row) {
      var track = row.firstElementChild;
      if (!track) return;
      var base = Array.prototype.slice.call(track.children).map(function (n) { return n.cloneNode(true); });
      var guard = 0;
      while (track.scrollWidth < window.innerWidth * 1.15 && guard++ < 6) {
        base.forEach(function (n) { track.appendChild(n.cloneNode(true)); });
      }
      var dup = track.cloneNode(true);
      dup.setAttribute('aria-hidden', 'true');
      row.appendChild(dup);
    });
  }

  /* ───────────────────────────────
     10. PLAGAS (tabs accesibles)
     ─────────────────────────────── */
  function initPests() {
    var tabs = $$('.pest-tab');
    var panels = $$('.pest-panel');
    var list = $('.pest-tabs');
    if (!tabs.length) return;

    function activate(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        var on = k === i;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
      var t = tabs[i];
      if (list && list.scrollWidth > list.clientWidth) {
        list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
      }
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        if (k > -1) { e.preventDefault(); activate(k, true); }
      });
    });
  }

  /* ───────────────────────────────
     11. SECTORES (acordeón horizontal en escritorio)
     ─────────────────────────────── */
  function initSectors() {
    var items = $$('.sector');
    if (!items.length) return;
    function set(el) { items.forEach(function (s) { s.classList.toggle('is-active', s === el); }); }
    items.forEach(function (s) {
      s.addEventListener('mouseenter', function () { if (isDesktop() && finePointer) set(s); });
      s.addEventListener('focusin', function () { if (isDesktop()) set(s); });
      s.addEventListener('click', function () { if (isDesktop()) set(s); });
    });
  }

  /* ───────────────────────────────
     12. GALERÍA + LIGHTBOX
     ─────────────────────────────── */
  function initGallery() {
    var vp = $('.gallery__viewport');
    var track = $('#gal-track');
    if (!vp || !track) return;
    var bar = $('#gal-bar');
    var prev = $('#gal-prev');
    var next = $('#gal-next');
    var shots = $$('.shot', track);

    function progress() {
      var max = vp.scrollWidth - vp.clientWidth;
      var k = max > 0 ? vp.scrollLeft / max : 0;
      if (bar) bar.style.transform = 'scaleX(' + (0.12 + clamp(k, 0, 1) * 0.88).toFixed(3) + ')';
    }
    vp.addEventListener('scroll', progress, { passive: true });
    progress();

    function step(dir) {
      var w = shots[0] ? shots[0].offsetWidth + 16 : 320;
      vp.scrollBy({ left: dir * w * 1.5, behavior: reduced ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });

    // Arrastrar con el mouse
    var down = false, moved = false, sx = 0, sl = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = vp.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; vp.classList.add('is-drag'); }
      if (moved) vp.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      vp.classList.remove('is-drag');
    });

    // Lightbox
    var lb = $('#lightbox');
    var img = $('#lb-img');
    var cap = $('#lb-cap');
    var closeBtn = $('#lb-close');
    var lbPrev = $('#lb-prev');
    var lbNext = $('#lb-next');
    var idx = 0;
    var lastFocus = null;

    function render() {
      var s = shots[idx];
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = '';
      img.src = s.getAttribute('data-full');
      img.alt = s.querySelector('img').alt;
      cap.textContent = s.getAttribute('data-cap') || '';
    }
    function open(i) {
      idx = i; render();
      lastFocus = doc.activeElement;
      lb.hidden = false;
      root.classList.add('lb-open');
      closeBtn.focus();
    }
    function close() {
      lb.hidden = true;
      root.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function go(d) { idx = (idx + d + shots.length) % shots.length; render(); }

    shots.forEach(function (s, i) {
      s.addEventListener('click', function () { if (moved) { moved = false; return; } open(i); });
    });
    closeBtn.addEventListener('click', close);
    lbPrev.addEventListener('click', function () { go(-1); });
    lbNext.addEventListener('click', function () { go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    doc.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') {
        var f = [closeBtn, lbPrev, lbNext];
        var k = f.indexOf(doc.activeElement);
        e.preventDefault();
        f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ───────────────────────────────
     13. FAQ
     ─────────────────────────────── */
  function initFaq() {
    var items = $$('.faq__item');
    items.forEach(function (item) {
      var btn = $('.faq__q', item);
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          $('.faq__q', o).setAttribute('aria-expanded', 'false');
        });
        if (open) { item.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ───────────────────────────────
     14. WHATSAPP: enlaces con mensaje, globo y formulario
     ─────────────────────────────── */
  function initWhatsApp() {
    $$('[data-wa]').forEach(function (a) { a.href = waLink(a.getAttribute('data-wa')); });

    var tip = $('#wa-tip');
    var tipX = $('#wa-tip-x');
    if (tip) {
      var dismissed = false;
      try { dismissed = sessionStorage.getItem('wa-tip') === '1'; } catch (e) { /* noop */ }
      if (!dismissed) {
        whenReady(function () {
          setTimeout(function () { tip.classList.add('is-show'); }, 7000);
          setTimeout(function () { tip.classList.remove('is-show'); }, 17000);
        });
      }
      if (tipX) tipX.addEventListener('click', function () {
        tip.classList.remove('is-show');
        try { sessionStorage.setItem('wa-tip', '1'); } catch (e) { /* noop */ }
      });
    }

    var form = $('#quote-form');
    if (!form) return;
    var ok = $('#form-ok');

    function setError(input, msg) {
      var field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      var err = $('.field__err', field);
      if (err) err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    function validate() {
      var f = form.elements;
      var first = null;
      var fail = function (input, msg) { setError(input, msg); if (!first) first = input; };
      var nombre = f.nombre.value.trim();
      var tel = f.telefono.value.replace(/\D/g, '');
      if (nombre.length < 2) fail(f.nombre, 'Escribe tu nombre para poder atenderte.'); else setError(f.nombre, '');
      if (tel.length < 10) fail(f.telefono, 'Ingresa un teléfono de 10 dígitos.'); else setError(f.telefono, '');
      if (!f.espacio.value) fail(f.espacio, 'Selecciona el tipo de espacio.'); else setError(f.espacio, '');
      if (first) first.focus();
      return !first;
    }
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('has-error')) setError(el, ''); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var f = form.elements;
      var lines = [
        'Hola, soy ' + f.nombre.value.trim() + '. Quiero mi cotización de control de plagas.',
        '',
        '• Tipo de espacio: ' + f.espacio.value,
        '• Plaga: ' + (f.plaga.value || 'No estoy seguro'),
        f.ciudad.value.trim() ? '• Ciudad: ' + f.ciudad.value.trim() : '',
        f.mensaje.value.trim() ? '• Detalles: ' + f.mensaje.value.trim() : '',
        '• Mi teléfono: ' + f.telefono.value.trim()
      ].filter(function (l, i) { return i < 2 || l; });
      if (ok) ok.hidden = false;
      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      form.reset();
      setTimeout(function () { if (ok) ok.hidden = true; }, 6000);
    });
  }

  /* ───────────────────────────────
     INICIO
     ─────────────────────────────── */
  function init() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    initLoader();
    initMenu();
    initMarquee();
    initReveal();
    initCounters();
    initRotator();
    initStatus();
    initTilt();
    initParticles();
    initPointerFx();
    initPests();
    initSectors();
    initGallery();
    initFaq();
    initWhatsApp();

    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll);
    onScroll();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();

/* ============================================================
   IGNIZ AI — "Editorial Atelier" shared interactions
   Preloader, hero light-up, scroll reveals, nav state,
   mobile menu, count-up, and the live gold-ribbon hero canvas.
   Include on every page: <script src="assets/editorial.js" defer></script>
============================================================ */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Split-text reveal for the homepage hero headline ----
     Words rise out of a mask one after another; the whole headline
     finishes in SPLIT_TOTAL ms. Word-level split keeps Arabic shaping intact. */
  var SPLIT_TOTAL = 2000;  // total ms from first word start to last word settled
  var SPLIT_WORD  = 900;   // ms each word takes to rise in

  function wrapWordsForSplit(node, gold) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var mask = document.createElement('span');
          mask.className = 'sr-mask';
          var word = document.createElement('span');
          word.className = 'sr-word' + (gold ? ' gold-text' : '');
          word.textContent = part;
          mask.appendChild(word);
          frag.appendChild(mask);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        wrapWordsForSplit(child, gold || child.classList.contains('gold-text'));
      }
    });
  }

  function startSplitReveal(title) {
    if (!title || title.dataset.srReady) return;
    title.dataset.srReady = '1';
    if (reduce) return; // reduced motion: leave the plain text as-is

    wrapWordsForSplit(title, false);
    var words = title.querySelectorAll('.sr-word');
    var n = words.length;
    var step = n > 1 ? (SPLIT_TOTAL - SPLIT_WORD) / (n - 1) : 0;
    words.forEach(function (w, i) {
      w.style.transitionDuration = SPLIT_WORD + 'ms';
      w.style.transitionDelay = Math.round(i * step) + 'ms';
    });

    title.classList.add('sr-armed');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { title.classList.add('sr-go'); });
    });
  }

  /* ---- Typewriter-on-scroll for any [data-typewriter] heading ----
     Characters appear one by one when the heading scrolls into view;
     the whole line types in TW_TOTAL ms (2s), holds, erases, and
     repeats forever. Skipped for RTL (keeps Arabic
     letters joined) and for reduced motion. */
  var TW_TOTAL = 2000; // ms for the whole heading to type in

  function wrapCharsForTypewriter(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        Array.prototype.forEach.call(child.textContent, function (ch) {
          var span = document.createElement('span');
          span.className = 'tw-ch' + (child.parentNode.classList && child.parentNode.classList.contains('gold-text') ? ' gold-text' : '');
          span.textContent = ch;
          frag.appendChild(span);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        wrapCharsForTypewriter(child);
      }
    });
  }

  function armTypewriter(el) {
    if (el.dataset.twReady) return false;
    el.dataset.twReady = '1';
    if (reduce || document.documentElement.dir === 'rtl') return false;
    wrapCharsForTypewriter(el);
    var chars = el.querySelectorAll('.tw-ch');
    var step = chars.length ? TW_TOTAL / chars.length : 0;
    chars.forEach(function (c, i) { c.style.transitionDelay = (i * step).toFixed(2) + 'ms'; });
    var cursor = document.createElement('span');
    cursor.className = 'tw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    el.appendChild(cursor);
    el.classList.add('tw-armed');
    return true;
  }

  var TW_HOLD  = 2000; // ms the full heading stays up before erasing
  var TW_ERASE = 800;  // ms to backspace the whole heading
  var TW_GAP   = 400;  // ms of empty line before typing again

  function setDelays(el, total, reverse) {
    var chars = el.querySelectorAll('.tw-ch'), n = chars.length;
    var step = n ? total / n : 0;
    chars.forEach(function (c, i) {
      c.style.transitionDelay = ((reverse ? n - 1 - i : i) * step).toFixed(2) + 'ms';
    });
  }

  /* Types in, holds, erases, and repeats forever. Timers are kept on the
     element so the loop can be stopped when the language changes. */
  function stopTypewriter(el) {
    (el.__twTimers || []).forEach(clearTimeout);
    el.__twTimers = [];
    el.classList.remove('tw-armed', 'tw-go');
    delete el.dataset.twReady;
  }
  function later(el, fn, ms) {
    el.__twTimers = el.__twTimers || [];
    el.__twTimers.push(setTimeout(fn, ms));
  }
  function loopTypewriter(el) {
    if (!el.classList.contains('tw-armed')) return;
    setDelays(el, TW_TOTAL, false);
    el.classList.add('tw-go');
    later(el, function () {
      setDelays(el, TW_ERASE, true);
      el.classList.remove('tw-go');
      later(el, function () { loopTypewriter(el); }, TW_ERASE + TW_GAP);
    }, TW_TOTAL + TW_HOLD);
  }

  var twIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      twIO.unobserve(e.target);
      var el = e.target;
      el.__twSeen = true;
      requestAnimationFrame(function () { loopTypewriter(el); });
    });
  }, { threshold: 0.6 });

  function setupTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach(function (el) {
      if (!armTypewriter(el)) return;
      if (el.__twSeen) requestAnimationFrame(function () { loopTypewriter(el); });
      else twIO.observe(el);
    });
  }
  setupTypewriters();

  /* Language switch (i18n.js swaps the heading text): stop the old loop
     and re-arm on the new text. Arabic is left static (see armTypewriter). */
  document.addEventListener('ignizlangchange', function () {
    document.querySelectorAll('[data-typewriter]').forEach(function (el) {
      stopTypewriter(el);
      el.querySelectorAll('.tw-cursor').forEach(function (c) { c.remove(); });
    });
    setupTypewriters();
  });

  /* ---- Work-card key features on touch screens ----
     No hover on phones/tablets, so each card's features panel
     reveals itself once it scrolls into view. */
  if (matchMedia('(hover: none)').matches) {
    var featPanels = document.querySelectorAll('.work-card__features');
    // Inside the carousel the sliding itself is the reveal: show panels straight away.
    document.querySelectorAll('#workCarousel .work-card__features').forEach(function (el) { el.classList.add('is-shown'); });
    if (reduce) {
      featPanels.forEach(function (el) { el.classList.add('is-shown'); });
    } else {
      var featIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-shown'); featIO.unobserve(e.target); }
        });
      }, { threshold: 0.3 });
      featPanels.forEach(function (el) { featIO.observe(el); });
    }
  }

  /* ---- Selected work: centred, infinite, auto-playing carousel ----
     The slide at DOM position 1 is centred and in focus (.is-active); the
     ones either side peek in, faded. Infinite by recycling: after moving on,
     the slide that left is moved to the other end of the track.
     Advances every INTERVAL ms; pauses while hovered (so the key-features
     panel can be read), while a control has focus, after a touch/click,
     when off-screen or the tab is hidden; no autoplay for reduced motion. */
  (function () {
    var root = document.getElementById('workCarousel');
    if (!root) return;
    var track = root.querySelector('.work-carousel__track');
    var viewport = root.querySelector('.work-carousel__viewport');
    var slides = Array.prototype.slice.call(track.children);
    var n = slides.length;
    if (n < 2) return;

    var INTERVAL = 2000;   // ms between slide changes
    var SLIDE_MS = 700;    // ms the movement takes
    var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

    slides.forEach(function (s, i) { s.dataset.idx = i; });
    // start with the first project centred: put the last one on the left
    track.insertBefore(track.lastElementChild, track.firstElementChild);

    var dotsWrap = root.querySelector('.work-carousel__dots');
    var dots = slides.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'work-carousel__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Project ' + (i + 1) + ' of ' + n);
      b.addEventListener('click', function () { hold(5000); goTo(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    var busy = false, hovering = false, focused = false, visible = false, holdUntil = 0;

    function step() { return track.children[1].offsetLeft - track.children[0].offsetLeft; }
    function base() {   // translate that centres DOM child 1
      var w = track.children[1].offsetWidth;
      return (viewport.clientWidth - w) / 2 - track.children[1].offsetLeft;
    }
    function place(x, animate) {
      track.style.transition = animate ? 'transform ' + SLIDE_MS + 'ms ' + EASE : 'none';
      track.style.transform = 'translateX(' + x + 'px)';
    }
    function markActive() {
      Array.prototype.forEach.call(track.children, function (el, i) {
        var on = i === 1;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        el.tabIndex = on ? 0 : -1;
      });
      var c = +track.children[1].dataset.idx;
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', i === c ? 'true' : 'false'); });
    }
    function settle() { place(base(), false); void track.offsetWidth; }
    function afterMove(cb) {
      var done = false;
      function finish(e) {
        if (done || (e && e.target !== track)) return;
        done = true;
        track.removeEventListener('transitionend', finish);
        cb();
      }
      track.addEventListener('transitionend', finish);
      setTimeout(finish, SLIDE_MS + 120);
    }
    function next() {
      if (busy) return;
      busy = true;
      closeFeatures();
      var d = step();
      track.children[1].classList.remove('is-active');
      track.children[2].classList.add('is-active');
      place(base() - d, true);
      afterMove(function () {
        track.appendChild(track.children[0]);
        settle(); markActive(); busy = false;
      });
    }
    function prev() {
      if (busy) return;
      busy = true;
      closeFeatures();
      var d = step();
      track.insertBefore(track.lastElementChild, track.firstElementChild);
      place(base() - d, false);          // same picture as before the DOM move
      void track.offsetWidth;
      track.children[2].classList.remove('is-active');
      track.children[1].classList.add('is-active');
      place(base(), true);
      afterMove(function () { settle(); markActive(); busy = false; });
    }
    function goTo(i) {
      if (busy) return;
      var k = (i - (+track.children[1].dataset.idx) + n) % n;
      if (k === 0) return;
      if (k === 1) return next();
      if (k === n - 1) return prev();
      for (var j = 0; j < k; j++) track.appendChild(track.children[0]);
      settle(); markActive();
    }
    function hold(ms) { holdUntil = Date.now() + ms; }

    root.querySelector('[data-dir="next"]').addEventListener('click', function () { hold(5000); next(); });
    root.querySelector('[data-dir="prev"]').addEventListener('click', function () { hold(5000); prev(); });

    function closeFeatures() {
      track.querySelectorAll('.work-card.show-features').forEach(function (c) {
        c.classList.remove('show-features');
        var b = c.querySelector('.work-card__more'); if (b) b.setAttribute('aria-expanded', 'false');
      });
      root.classList.remove('features-open');
    }
    function featuresOpen() { return !!track.querySelector('.work-card.show-features'); }

    track.addEventListener('click', function (e) {
      var card = e.target.closest('.work-card');
      if (!card) return;
      // a faded side project: bring it to the centre instead of opening it
      if (!card.classList.contains('is-active')) {
        e.preventDefault();
        hold(5000);
        var pos = Array.prototype.indexOf.call(track.children, card);
        if (pos === 0) prev(); else goTo(+card.dataset.idx);
        return;
      }
      // touch: "Key features" opens the panel over the card, × closes it
      if (e.target.closest('.work-card__more')) {
        e.preventDefault();
        var open = !card.classList.contains('show-features');
        closeFeatures();
        if (open) {
          card.classList.add('show-features');
          root.classList.add('features-open');
          e.target.closest('.work-card__more').setAttribute('aria-expanded', 'true');
          var close = card.querySelector('.work-card__close'); if (close) close.focus({ preventScroll: true });
        }
        return;
      }
      if (e.target.closest('.work-card__close')) {
        e.preventDefault();
        closeFeatures();
        var more = card.querySelector('.work-card__more'); if (more) more.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('a, button')) return;          // real links / buttons do their own thing
      if (card.classList.contains('show-features')) return; // tapping inside the open panel
      var href = card.getAttribute('data-href');
      if (href && matchMedia('(hover: hover)').matches) window.open(href, '_blank', 'noopener');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && featuresOpen()) closeFeatures(); });

    // the viewport only moves via transform; undo any browser-driven scroll (e.g. focus)
    viewport.addEventListener('scroll', function () { if (viewport.scrollLeft) viewport.scrollLeft = 0; });
    // pause only while the pointer is over the centred project (to read its features);
    // the carousel spans the full width, so hovering the faded sides must not stop it
    track.addEventListener('mouseover', function (e) {
      var card = e.target.closest('.work-card');
      hovering = !!(card && card.classList.contains('is-active'));
    });
    viewport.addEventListener('mouseleave', function () { hovering = false; });
    root.addEventListener('focusin', function (e) { focused = e.target.matches(':focus-visible'); });
    root.addEventListener('focusout', function () { focused = false; });

    var sx = null, sy = null;
    viewport.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; hold(6000);
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (featuresOpen()) return;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
    }, { passive: true });

    /* Size the cards so the whole section (heading + carousel + dots) fits the screen */
    var section = document.getElementById('work-showcase');
    function fitToScreen() {
      if (!section) return;
      var cs = getComputedStyle(section);
      var head = section.querySelector('.sec-head');
      var hs = head ? getComputedStyle(head) : null;
      var vs = getComputedStyle(viewport);
      var ds = getComputedStyle(dotsWrap);
      var used = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
        (head ? head.offsetHeight + parseFloat(hs.marginBottom) : 0) +
        parseFloat(vs.paddingTop) + parseFloat(vs.paddingBottom) +
        dotsWrap.offsetHeight + parseFloat(ds.marginTop) + 4;
      var h = Math.round(Math.max(window.innerWidth < 600 ? 240 : 300, Math.min(860, window.innerHeight - used)));
      root.style.setProperty('--card-h', h + 'px');
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { fitToScreen(); if (!busy) settle(); }, 80); });
    document.addEventListener('ignizlangchange', function () { setTimeout(function () { if (!busy) settle(); }, 50); });

    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.3 }).observe(root);

    setInterval(function () {
      if (reduce || hovering || focused || !visible || document.hidden || Date.now() < holdUntil || featuresOpen()) return;
      next();
    }, INTERVAL);

    fitToScreen(); settle(); markActive();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitToScreen(); if (!busy) settle(); });
    window.addEventListener('load', function () { fitToScreen(); if (!busy) settle(); });
    document.addEventListener('ignizlangchange', function () { setTimeout(fitToScreen, 60); });
  })();

  /* ---- Light up hero(es) ---- */
  function lightHeroes() {
    document.querySelectorAll('#hero, .page-hero, .article-hero').forEach(function (h) {
      h.classList.add('is-lit');
      startSplitReveal(h.querySelector('.hero__title--split'));
    });
  }

  /* ---- Preloader → reveal ---- */
  function finishPreloader() {
    var pl = document.getElementById('preloader');
    if (pl) pl.classList.add('done');
    lightHeroes();
  }
  var HOLD = reduce ? 0 : 1200;
  if (document.getElementById('preloader')) {
    window.addEventListener('load', function () { setTimeout(finishPreloader, HOLD); });
    if (document.readyState === 'complete') setTimeout(finishPreloader, reduce ? 0 : 800);
  } else {
    /* no preloader on this page — light immediately */
    lightHeroes();
  }

  /* ---- Scroll reveals ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---- Nav solid on scroll ---- */
  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('is-solid', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  var burger = document.getElementById('hamburger'), mm = document.getElementById('mobileMenu');
  if (burger && mm) {
    burger.addEventListener('click', function () {
      var open = mm.classList.toggle('open'); burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : '';
    });
    mm.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mm.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow = ''; });
    });
  }

  /* ---- Count-up stats ---- */
  var counted = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target + suf; counted.unobserve(el); return; }
      var t0 = null, dur = 1500;
      function tick(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1); var e2 = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e2) + suf; if (p < 1) requestAnimationFrame(tick); }
      requestAnimationFrame(tick); counted.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counted.observe(el); });

  /* ---- Live gold-ribbon hero canvas (every canvas.aura) ---- */
  function initAura(cv) {
    var ctx = cv.getContext('2d'), W, H, DPR, blobs, ribbons, raf;
    function size() { DPR = Math.min(devicePixelRatio || 1, 2); W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    function make() {
      size();
      blobs = [
        { x: W * 0.20, y: H * 0.30, r: Math.max(W, H) * 0.46, hue: 'rgba(201,154,58,0.18)', ax: 0.00006, ay: 0.00004, px: 0, py: 1.3 },
        { x: W * 0.84, y: H * 0.66, r: Math.max(W, H) * 0.42, hue: 'rgba(176,133,40,0.15)', ax: 0.00005, ay: 0.00007, px: 2.1, py: 0.6 }
      ];
      /* 7 flowing ribbons spanning the full height — intensified */
      ribbons = [
        { y: 0.14, amp: 0.10, len: 0.95, sp: 0.00024, ph: 0.4, w: 1.8, a: 0.40 },
        { y: 0.26, amp: 0.14, len: 0.78, sp: 0.00020, ph: 1.7, w: 2.6, a: 0.52 },
        { y: 0.38, amp: 0.12, len: 1.10, sp: 0.00028, ph: 3.3, w: 1.6, a: 0.44 },
        { y: 0.52, amp: 0.16, len: 0.86, sp: 0.00017, ph: 4.8, w: 3.0, a: 0.50 },
        { y: 0.64, amp: 0.13, len: 0.98, sp: 0.00023, ph: 2.4, w: 2.0, a: 0.42 },
        { y: 0.78, amp: 0.15, len: 0.72, sp: 0.00019, ph: 0.9, w: 2.4, a: 0.46 },
        { y: 0.90, amp: 0.11, len: 1.05, sp: 0.00026, ph: 5.5, w: 1.6, a: 0.36 }
      ];
    }
    function ribbonPath(r, t) {
      ctx.beginPath();
      var steps = 52, baseY = r.y * H, amp = r.amp * H, wl = r.len * W;
      for (var i = 0; i <= steps; i++) {
        var x = (i / steps) * W;
        var y = baseY
          + Math.sin(x / wl * 6.283 + t * r.sp + r.ph) * amp
          + Math.sin(x / wl * 12.566 + t * r.sp * 1.7 + r.ph) * amp * 0.30;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    function frame(t) {
      if (!cv.isConnected) return;
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(function (b) {
        var cx = b.x + Math.sin(t * b.ax + b.px) * W * 0.08, cy = b.y + Math.cos(t * b.ay + b.py) * H * 0.08;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        g.addColorStop(0, b.hue); g.addColorStop(1, 'rgba(247,243,236,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.lineCap = 'round';
      ribbons.forEach(function (r) {
        var grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, 'rgba(176,133,40,0)');
        grad.addColorStop(0.26, 'rgba(201,154,58,' + r.a + ')');
        grad.addColorStop(0.6, 'rgba(228,192,99,' + (r.a * 0.92) + ')');
        grad.addColorStop(1, 'rgba(176,133,40,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = r.w;
        ctx.shadowColor = 'rgba(201,154,58,0.40)'; ctx.shadowBlur = 14;
        ribbonPath(r, t); ctx.stroke(); ctx.shadowBlur = 0;
      });
      raf = requestAnimationFrame(frame);
    }
    make();
    if (reduce) frame(0); else raf = requestAnimationFrame(frame);
    addEventListener('resize', make, { passive: true });
  }
  document.querySelectorAll('canvas.aura').forEach(initAura);
})();

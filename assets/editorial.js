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

/* ============================================================
   IGNIZ AI — "Editorial Atelier" shared interactions
   Preloader, hero light-up, scroll reveals, nav state,
   mobile menu, count-up, and the live gold-ribbon hero canvas.
   Include on every page: <script src="assets/editorial.js" defer></script>
============================================================ */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Always open a page at the top ----
     Browsers normally restore the old scroll position on reload / back.
     Turn that off and jump to the top on every load. A link that points
     at a section on purpose (e.g. /#work-showcase) still lands there. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function toTop() {
    if (location.hash && document.getElementById(location.hash.slice(1))) return;
    var html = document.documentElement, prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';           // jump, don't animate
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });

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
  /* Custom entrance animations (About › Leadership): replay every time the
     section is scrolled into view. Plays once its top has passed 35% of the
     window height; resets (instantly, out of sight) once it has fully left
     the screen, so it plays again on the next visit — scrolling down or up. */
  var animEls = document.querySelectorAll('[data-anim]');
  if (animEls.length) {
    var animSection = animEls[0].closest('section') || animEls[0];
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) animEls.forEach(function (el) { el.classList.add('is-in'); });
    }, { threshold: 0, rootMargin: '0px 0px -35% 0px' }).observe(animSection);
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) return;
      animEls.forEach(function (el) {
        el.classList.add('anim-reset');          // snap back without animating
        el.classList.remove('is-in');
        void el.offsetWidth;
        el.classList.remove('anim-reset');
      });
    }, { threshold: 0 }).observe(animSection);
  }

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

  /* ---- Live gold-ribbon hero canvas (every canvas.aura) ----
     On the home page (canvas[data-logo]) the floating ribbons periodically flow together
     and draw the Igniz flame logo in the same gold, hold it, then drift apart again. */
  var FLAME = {"aspect":0.6728,"outer":[[-0.0542,0.4954],[-0.0666,0.4851],[-0.0809,0.4764],[-0.0942,0.4662],[-0.1068,0.4552],[-0.1183,0.4429],[-0.1291,0.4302],[-0.1387,0.4164],[-0.1471,0.4019],[-0.1542,0.3867],[-0.1592,0.3708],[-0.1635,0.3545],[-0.167,0.3382],[-0.1681,0.3215],[-0.1655,0.3049],[-0.1589,0.2898],[-0.1451,0.2939],[-0.1374,0.3089],[-0.1287,0.3231],[-0.1186,0.3365],[-0.1071,0.3487],[-0.0938,0.3589],[-0.0797,0.3679],[-0.0644,0.3748],[-0.0566,0.3656],[-0.063,0.3501],[-0.067,0.3339],[-0.0686,0.3172],[-0.0684,0.3004],[-0.0661,0.2838],[-0.0615,0.2677],[-0.0562,0.2518],[-0.0515,0.2357],[-0.0483,0.2193],[-0.048,0.2026],[-0.0513,0.1862],[-0.0575,0.1706],[-0.0648,0.1556],[-0.0732,0.141],[-0.0805,0.1259],[-0.0879,0.1109],[-0.095,0.0957],[-0.1017,0.0803],[-0.1066,0.0644],[-0.109,0.0478],[-0.1101,0.031],[-0.1105,0.0143],[-0.1069,-0.0018],[-0.0924,-0.0009],[-0.083,0.0128],[-0.0737,0.0267],[-0.0626,0.0393],[-0.0501,0.0504],[-0.0423,0.0425],[-0.0463,0.0262],[-0.0489,0.0097],[-0.051,-0.0069],[-0.0517,-0.0237],[-0.0516,-0.0405],[-0.0496,-0.0571],[-0.0454,-0.0733],[-0.0396,-0.089],[-0.0321,-0.104],[-0.0229,-0.1181],[-0.0095,-0.1273],[0.0015,-0.1162],[0.0059,-0.1001],[0.0108,-0.0841],[0.017,-0.0685],[0.0244,-0.0535],[0.0318,-0.0384],[0.0392,-0.0234],[0.0462,-0.0081],[0.0516,0.0077],[0.0562,0.0238],[0.0589,0.0403],[0.0596,0.0571],[0.0586,0.0737],[0.0721,0.0705],[0.0829,0.0576],[0.0915,0.0433],[0.1025,0.0311],[0.1131,0.0411],[0.1125,0.0578],[0.1104,0.0744],[0.1058,0.0905],[0.0993,0.106],[0.0913,0.1207],[0.0828,0.1351],[0.0737,0.1492],[0.0655,0.1638],[0.0586,0.1791],[0.0536,0.1951],[0.0512,0.2117],[0.052,0.2284],[0.0566,0.2445],[0.0622,0.2603],[0.0679,0.2761],[0.0725,0.2921],[0.0752,0.3087],[0.0753,0.3254],[0.0719,0.3418],[0.0665,0.3576],[0.0629,0.3737],[0.0782,0.3738],[0.0931,0.366],[0.1066,0.3562],[0.1184,0.3443],[0.1282,0.3307],[0.1366,0.3162],[0.1431,0.3008],[0.1495,0.2854],[0.1632,0.285],[0.1688,0.3007],[0.1716,0.3172],[0.1726,0.3339],[0.1718,0.3507],[0.1689,0.3672],[0.1632,0.3829],[0.1563,0.3982],[0.1478,0.4126],[0.1383,0.4264],[0.1275,0.4392],[0.116,0.4514],[0.1044,0.4635],[0.0921,0.4749],[0.0773,0.4827],[0.062,0.4894],[0.066,0.4998],[0.0827,0.4984],[0.0992,0.4954],[0.1154,0.491],[0.1311,0.4851],[0.1465,0.4786],[0.1616,0.4713],[0.176,0.4628],[0.1902,0.4538],[0.2039,0.4442],[0.2171,0.4339],[0.2297,0.4228],[0.2418,0.4112],[0.2538,0.3994],[0.2647,0.3868],[0.2747,0.3733],[0.2844,0.3596],[0.2935,0.3456],[0.3006,0.3304],[0.3069,0.3149],[0.3139,0.2996],[0.3197,0.2839],[0.3246,0.2679],[0.3288,0.2517],[0.3319,0.2352],[0.3343,0.2186],[0.3358,0.2019],[0.3364,0.1852],[0.3364,0.1684],[0.3364,0.1516],[0.3355,0.1349],[0.3336,0.1182],[0.3297,0.102],[0.3261,0.0856],[0.3226,0.0692],[0.3176,0.0532],[0.3116,0.0375],[0.3051,0.0221],[0.2987,0.0066],[0.2902,-0.0078],[0.281,-0.0218],[0.2716,-0.0357],[0.2586,-0.0376],[0.2607,-0.0211],[0.2625,-0.0045],[0.2625,0.0122],[0.2621,0.029],[0.2588,0.0454],[0.254,0.0615],[0.2486,0.0773],[0.2417,0.0926],[0.2327,0.1067],[0.2226,0.1201],[0.2114,0.1326],[0.199,0.1438],[0.185,0.153],[0.1694,0.1589],[0.157,0.1511],[0.1635,0.136],[0.1737,0.1227],[0.184,0.1094],[0.1932,0.0955],[0.2022,0.0813],[0.2098,0.0664],[0.2165,0.051],[0.2228,0.0354],[0.227,0.0192],[0.2301,0.0028],[0.233,-0.0137],[0.2352,-0.0303],[0.2357,-0.0471],[0.2351,-0.0638],[0.2332,-0.0805],[0.2308,-0.0971],[0.228,-0.1136],[0.2227,-0.1295],[0.2168,-0.1452],[0.2106,-0.1608],[0.2033,-0.1758],[0.1947,-0.1902],[0.1866,-0.2049],[0.1764,-0.2181],[0.1623,-0.2272],[0.1506,-0.2391],[0.145,-0.2328],[0.1494,-0.2167],[0.1519,-0.2001],[0.1524,-0.1834],[0.1514,-0.1667],[0.148,-0.1503],[0.1409,-0.1351],[0.1284,-0.1242],[0.1121,-0.1232],[0.0988,-0.133],[0.0907,-0.1476],[0.089,-0.1641],[0.0926,-0.1805],[0.0973,-0.1966],[0.1009,-0.213],[0.1047,-0.2293],[0.1075,-0.2458],[0.1088,-0.2625],[0.1095,-0.2792],[0.1086,-0.296],[0.1063,-0.3126],[0.1044,-0.3292],[0.0994,-0.3452],[0.0933,-0.3608],[0.0879,-0.3767],[0.0806,-0.3917],[0.069,-0.3982],[0.0554,-0.396],[0.048,-0.411],[0.0395,-0.4255],[0.0294,-0.4389],[0.0185,-0.4516],[0.0089,-0.4653],[0.0005,-0.4798],[-0.0081,-0.4941],[-0.016,-0.4925],[-0.0127,-0.476],[-0.0087,-0.4598],[-0.0048,-0.4435],[-0.0028,-0.4268],[-0.0031,-0.4101],[-0.0034,-0.3933],[-0.0049,-0.3767],[-0.0096,-0.3606],[-0.0149,-0.3447],[-0.0214,-0.3292],[-0.0301,-0.3149],[-0.039,-0.3007],[-0.0477,-0.2864],[-0.0578,-0.273],[-0.0679,-0.2596],[-0.0765,-0.2453],[-0.086,-0.2315],[-0.0958,-0.2179],[-0.1049,-0.2038],[-0.1138,-0.1896],[-0.1212,-0.1746],[-0.129,-0.1598],[-0.1434,-0.1594],[-0.1487,-0.1751],[-0.1504,-0.1918],[-0.1493,-0.2085],[-0.1466,-0.225],[-0.1421,-0.2411],[-0.1496,-0.2492],[-0.1633,-0.2397],[-0.1744,-0.2272],[-0.1846,-0.2139],[-0.1929,-0.1993],[-0.2014,-0.1849],[-0.2095,-0.1702],[-0.2167,-0.1551],[-0.2217,-0.1391],[-0.2265,-0.123],[-0.2311,-0.1069],[-0.2329,-0.0903],[-0.2348,-0.0736],[-0.2357,-0.0569],[-0.2354,-0.0401],[-0.2334,-0.0235],[-0.2314,-0.0068],[-0.2286,0.0097],[-0.2242,0.0259],[-0.2182,0.0415],[-0.2112,0.0567],[-0.2039,0.0718],[-0.1949,0.0859],[-0.1855,0.0998],[-0.1762,0.1138],[-0.1665,0.1275],[-0.157,0.1413],[-0.1593,0.1561],[-0.1753,0.1539],[-0.1897,0.1453],[-0.2027,0.1347],[-0.2144,0.1228],[-0.2249,0.1097],[-0.234,0.0956],[-0.242,0.0809],[-0.2487,0.0656],[-0.2547,0.0499],[-0.2588,0.0336],[-0.2619,0.0172],[-0.2637,0.0005],[-0.2624,-0.0162],[-0.2595,-0.0327],[-0.27,-0.0375],[-0.2801,-0.0241],[-0.2895,-0.0103],[-0.2977,0.0044],[-0.305,0.0194],[-0.3106,0.0352],[-0.3156,0.0512],[-0.3211,0.067],[-0.326,0.0831],[-0.329,0.0995],[-0.3319,0.1161],[-0.334,0.1327],[-0.3353,0.1494],[-0.3362,0.1661],[-0.3364,0.1829],[-0.3358,0.1997],[-0.3347,0.2164],[-0.3336,0.2331],[-0.3302,0.2495],[-0.3255,0.2656],[-0.3215,0.2818],[-0.3162,0.2977],[-0.3098,0.3132],[-0.3028,0.3284],[-0.2951,0.3433],[-0.2864,0.3576],[-0.277,0.3715],[-0.2672,0.3851],[-0.2561,0.3977],[-0.2444,0.4097],[-0.2321,0.4211],[-0.2192,0.4318],[-0.206,0.4422],[-0.1926,0.4522],[-0.1786,0.4615],[-0.164,0.4697],[-0.1489,0.477],[-0.1337,0.4841],[-0.1181,0.4902],[-0.1022,0.4953],[-0.0857,0.4983],[-0.069,0.4999]],"drop":[[-0.0706,-0.4075],[-0.0745,-0.4018],[-0.0769,-0.395],[-0.0795,-0.3883],[-0.0815,-0.3815],[-0.0835,-0.3746],[-0.0861,-0.3679],[-0.0887,-0.3613],[-0.0911,-0.3545],[-0.0932,-0.3476],[-0.0948,-0.3407],[-0.0964,-0.3337],[-0.0977,-0.3266],[-0.0984,-0.3195],[-0.0985,-0.3124],[-0.0979,-0.3052],[-0.0969,-0.2981],[-0.095,-0.2912],[-0.0916,-0.285],[-0.0856,-0.2815],[-0.0791,-0.284],[-0.074,-0.289],[-0.07,-0.2949],[-0.0665,-0.3012],[-0.0633,-0.3076],[-0.0597,-0.3138],[-0.0569,-0.3204],[-0.0545,-0.3271],[-0.0522,-0.3339],[-0.0502,-0.3408],[-0.0493,-0.3479],[-0.0484,-0.355],[-0.0477,-0.3621],[-0.0481,-0.3693],[-0.0491,-0.3764],[-0.05,-0.3835],[-0.0511,-0.3905],[-0.0537,-0.3972],[-0.058,-0.4028],[-0.0638,-0.407]]};
  function initAura(cv) {
    var ctx = cv.getContext('2d'), W, H, DPR, blobs, ribbons, raf;
    var logoMode = cv.hasAttribute('data-logo');
    var L = { x: 0, y: 0, s: 0, dim: 1 };          /* where the logo is drawn */
    var t0 = null, hero = cv.closest('#hero');
    function size() { DPR = Math.min(devicePixelRatio || 1, 2); W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    function layout() {
      /* put the logo in the open space to the right of the hero card; on narrow
         screens it sits softly behind the (transparent) card instead */
      var card = cv.parentNode && cv.parentNode.querySelector('.hero__glass');
      var cr = cv.getBoundingClientRect(), right = 0, top = 0, bottom = H;
      if (card) { var r = card.getBoundingClientRect(); right = r.right - cr.left; top = r.top - cr.top; bottom = r.bottom - cr.top; }
      var free = W - right;
      if (free >= 300) {
        L.s = Math.min(H * 0.66, (free - 60) / FLAME.aspect, 560);
        L.x = right + free / 2; L.y = Math.max(top, 0) + (Math.min(bottom, H) - Math.max(top, 0)) / 2 + 10; L.dim = 1;
      } else {
        L.s = Math.min(H * 0.46, W * 0.9 / FLAME.aspect); L.x = W * 0.5; L.y = H * 0.52; L.dim = 0.45;
      }
    }
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
      if (logoMode) {
        /* each of the first 6 ribbons becomes one stretch of the flame outline (they join end to end);
           the 7th becomes the small flame droplet */
        var n = FLAME.outer.length, seg = n / 6;
        ribbons.forEach(function (r, k) {
          var pts = [];
          if (k < 6) { for (var i = Math.round(k * seg); i <= Math.round((k + 1) * seg); i++) pts.push(FLAME.outer[i % n]); }
          else { FLAME.drop.forEach(function (p) { pts.push(p); }); pts.push(FLAME.drop[0]); }
          r.logo = pts;
          r.w = Math.max(r.w, 2.2);
        });
        layout();
      }
    }
    function waveY(r, x, t) {
      var baseY = r.y * H, amp = r.amp * H, wl = r.len * W;
      return baseY + Math.sin(x / wl * 6.283 + t * r.sp + r.ph) * amp
                   + Math.sin(x / wl * 12.566 + t * r.sp * 1.7 + r.ph) * amp * 0.30;
    }
    function ribbonPath(r, t) {
      ctx.beginPath();
      var steps = 52;
      for (var i = 0; i <= steps; i++) {
        var x = (i / steps) * W, y = waveY(r, x, t);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    var ease = function (p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
    var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    /* cycle (ms), starting as soon as the page is revealed:
       form the flame over 3s → hold 7s → release 3s → float 3.6s → form again */
    var P = 16600, F1 = 2490, STAG = 85, R0 = 10000, RL = 3000;
    function formAt(tau, k) {
      var d = k * STAG;                             /* ribbons arrive one after another; last one lands at ~3s */
      if (tau < d) return 0;
      if (tau < F1 + d) return (tau - d) / F1;
      if (tau < R0 + d) return 1;
      if (tau < R0 + d + RL) return 1 - (tau - R0 - d) / RL;
      return 0;
    }
    function logoRibbon(r, k, t, f) {
      var pts = r.logo, n = pts.length, bob = Math.sin(t * 0.0011) * 6;
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        /* points further along the ribbon arrive a little later — it "pours" into shape */
        var pf = ease(clamp((f - (i / (n - 1)) * 0.35) / 0.65));
        var fx = (i / (n - 1)) * W, fy = waveY(r, fx, t);
        var wob = Math.sin(t * 0.0021 + i * 0.35 + k) * 1.6;
        var lx = L.x + pts[i][0] * L.s, ly = L.y + pts[i][1] * L.s + bob + wob;
        var x = fx + (lx - fx) * pf, y = fy + (ly - fy) * pf;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    function fillLogo(t, amt) {
      var bob = Math.sin(t * 0.0011) * 6;
      [FLAME.outer, FLAME.drop].forEach(function (pts) {
        ctx.beginPath();
        pts.forEach(function (p, i) { var x = L.x + p[0] * L.s, y = L.y + p[1] * L.s + bob; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.closePath();
        var g = ctx.createLinearGradient(L.x, L.y - L.s / 2, L.x, L.y + L.s / 2);
        g.addColorStop(0, 'rgba(228,192,99,' + (0.16 * amt) + ')');
        g.addColorStop(1, 'rgba(176,133,40,' + (0.10 * amt) + ')');
        ctx.fillStyle = g; ctx.fill();
      });
    }
    function frame(t) {
      if (!cv.isConnected) return;
      /* start the logo timeline once the hero is revealed (after the preloader) */
      if (t0 === null && (!logoMode || !hero || hero.classList.contains('is-lit'))) t0 = t;
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(function (b) {
        var cx = b.x + Math.sin(t * b.ax + b.px) * W * 0.08, cy = b.y + Math.cos(t * b.ay + b.py) * H * 0.08;
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r);
        g.addColorStop(0, b.hue); g.addColorStop(1, 'rgba(247,243,236,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var tau = reduce ? (F1 + 1000) : (t0 === null ? 0 : (t - t0) % P), minF = 1;
      ribbons.forEach(function (r, k) {
        var raw = logoMode ? clamp(formAt(tau, k)) : 0, f = ease(raw);
        minF = Math.min(minF, f);
        /* the gold gradient narrows from the full width onto the logo as the ribbon forms */
        var gx0 = 0 + (L.x - L.s * 0.45) * f, gx1 = W + (L.x + L.s * 0.45 - W) * f;
        var a = r.a * (1 - f) + 0.88 * L.dim * f;
        var edge = a * 0.8 * f;
        var grad = ctx.createLinearGradient(gx0, 0, gx1, 0);
        grad.addColorStop(0, 'rgba(176,133,40,' + edge + ')');
        grad.addColorStop(0.26, 'rgba(201,154,58,' + a + ')');
        grad.addColorStop(0.6, 'rgba(228,192,99,' + (a * 0.92) + ')');
        grad.addColorStop(1, 'rgba(176,133,40,' + edge + ')');
        ctx.strokeStyle = grad; ctx.lineWidth = r.w + f * 0.8;
        ctx.shadowColor = 'rgba(201,154,58,' + (0.40 + 0.2 * f) + ')'; ctx.shadowBlur = 14;
        if (raw > 0) logoRibbon(r, k, t, raw); else ribbonPath(r, t);
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      if (logoMode && minF > 0) fillLogo(t, minF * L.dim);
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    make();
    if (reduce) frame(0); else raf = requestAnimationFrame(frame);
    addEventListener('resize', function () { make(); if (reduce) frame(0); }, { passive: true });
    if (logoMode) addEventListener('load', function () { layout(); if (reduce) frame(0); });
  }
  document.querySelectorAll('canvas.aura').forEach(initAura);
})();

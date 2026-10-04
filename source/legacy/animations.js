(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════════════════════════════════════════
     SCROLL PROGRESS BAR
  ═══════════════════════════════════════════════ */
  function initProgress() {
    var bar = document.getElementById('m-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'm-progress';
      document.body.appendChild(bar);
    }
    function onScroll() {
      var el  = document.documentElement;
      var top = el.scrollTop || document.body.scrollTop;
      var h   = el.scrollHeight - el.clientHeight;
      bar.style.width = (h > 0 ? (top / h) * 100 : 0) + '%';
    }
    window.removeEventListener('scroll', window._mProgress);
    window._mProgress = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ═══════════════════════════════════════════════
     WORD-SPLIT REVEAL
     Splits headings into per-word spans that
     stagger in — replaces the CSS fade-up animation
     on .page-hero__title and .hero__headline
  ═══════════════════════════════════════════════ */
  var WORD_SPLIT_SEL = '.page-hero__title, .hero__headline';

  function buildWordHTML(el) {
    var html = '';
    el.childNodes.forEach(function (node) {
      if (node.nodeType === 3) { // text node
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (/^\s+$/.test(part)) {
            html += ' ';
          } else if (part) {
            html += '<span class="m-word">' + part + '</span>';
          }
        });
      } else if (node.nodeName === 'BR') {
        html += '<br>';
      } else if (node.nodeType === 1) {
        var cls   = node.className ? ' ' + node.className : '';
        var style = node.getAttribute('style') ? ' style="' + node.getAttribute('style') + '"' : '';
        node.textContent.trim().split(/\s+/).filter(Boolean).forEach(function (word) {
          html += '<span class="m-word' + cls + '"' + style + '>' + word + '</span> ';
        });
      }
    });
    return html;
  }

  function applyWordSplit(el) {
    if (reducedMotion || el.hasAttribute('data-m-split')) return;
    el.setAttribute('data-m-split', '1');
    el.classList.add('m-split-active');
    el.classList.remove('reveal', 'm-anim', 'm-reveal', 'm-reveal-up', 'm-reveal-left', 'm-reveal-scale');
    el.removeAttribute('data-m-anim');
    el.innerHTML = buildWordHTML(el);

    var words = el.querySelectorAll('.m-word');
    var baseDelay = el.classList.contains('page-hero__title') ? 0.32 : 0.05;
    words.forEach(function (span, i) {
      span.style.transitionDelay = (baseDelay + i * 0.055) + 's';
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        words.forEach(function (span) { span.classList.add('m-w-in'); });
      });
    });
  }

  function applyWordSplits(root) {
    var container = root || document;
    container.querySelectorAll(WORD_SPLIT_SEL + ':not([data-m-split])').forEach(applyWordSplit);
  }

  /* ═══════════════════════════════════════════════
     SCROLL REVEAL
  ═══════════════════════════════════════════════ */
  var revealIO = null;

  var AUTO_SELECTORS = [
    /* ── Section chrome ── */
    '.section__label',
    '.section__heading',
    '.section__sub',
    '.section-eyebrow',
    '.section-heading',

    /* ── Homepage ── */
    '.problem-card',
    '.bp-card',
    '.hero__stat',
    '.testi-card',

    /* ── Services ── */
    '.svc-tab',
    '.wc-card',
    '.tech-tag',

    /* ── Process ── */
    '.ps-step',

    /* ── Why Choose cards ── */
    '.why-card',

    /* ── Blog ── */
    '.blog-card',

    /* ── About ── */
    '.mv-card',
    '.value-card',
    '.story-body',
    '.ind-card',

    /* ── Contact ── */
    '.expect-card',
    '.contact-form-wrap',
    '.contact-info-item',
    '.trust-pill',

    /* ── Work / Case studies ── */
    '.case-card',
    '.stat-item',

    /* ── CTA ── */
    '.cta-section__heading',
    '.cta-section__sub',
    '.magnetic-wrap',
    '.grow-cta__heading',
    '.grow-cta__sub',

    /* ── FAQ ── */
    '.faq-item',

    /* ── Blog article body ── */
    '.article-body > p',
    '.article-body > h2',
    '.article-body > h3',
    '.article-body > ul',
    '.article-body > blockquote',
    '.article-body > .article-cta',

    /* ── Footer ── */
    '.footer__col',
    '.footer__brand',
  ];

  var DIRECTION = {
    '.section__label':              'm-reveal',
    '.section__heading':            'm-reveal',
    '.section__sub':                'm-reveal',
    '.problem-card':                'm-reveal-up',
    '.bp-card':                     'm-reveal-up',
    '.hero__stat':                  'm-reveal-scale',
    '.testi-card':                  'm-reveal-up',
    '.svc-tab':                     'm-reveal-up',
    '.wc-card':                     'm-reveal-up',
    '.tech-tag':                    'm-reveal-scale',
    '.ps-step':                     'm-reveal-up',
    '.why-card':                    'm-reveal-up',
    '.blog-card':                   'm-reveal-up',
    '.mv-card':                     'm-reveal-up',
    '.value-card':                  'm-reveal-up',
    '.story-body':                  'm-reveal',
    '.ind-card':                    'm-reveal-up',
    '.expect-card':                 'm-reveal-up',
    '.contact-form-wrap':           'm-reveal-up',
    '.contact-info-item':           'm-reveal-left',
    '.trust-pill':                  'm-reveal-scale',
    '.case-card':                   'm-reveal-up',
    '.stat-item':                   'm-reveal-scale',
    '.cta-section__heading':        'm-reveal',
    '.cta-section__sub':            'm-reveal',
    '.magnetic-wrap':               'm-reveal-scale',
    '.grow-cta__heading':           'm-reveal',
    '.grow-cta__sub':               'm-reveal',
    '.faq-item':                    'm-reveal',
    '.article-body > p':            'm-reveal',
    '.article-body > h2':           'm-reveal',
    '.article-body > h3':           'm-reveal',
    '.article-body > ul':           'm-reveal',
    '.article-body > blockquote':   'm-reveal-left',
    '.article-body > .article-cta': 'm-reveal-up',
    '.footer__col':                 'm-reveal-up',
    '.footer__brand':               'm-reveal',
  };

  /* Selectors where odd/even siblings alternate left↔right slide */
  var ALTERNATING = ['.case-card', '.wc-card'];

  function tagElement(el, cls) {
    if (el.hasAttribute('data-m-anim') || el.hasAttribute('data-m-split')) return;
    el.setAttribute('data-m-anim', cls);
    el.classList.add('m-anim', cls);
  }

  function autoTag(root) {
    var container = root || document;

    AUTO_SELECTORS.forEach(function (sel) {
      var defaultCls = DIRECTION[sel] || 'm-reveal';
      var doAlternate = ALTERNATING.indexOf(sel) !== -1;
      var elements = Array.from(container.querySelectorAll(sel));

      var byParent = new Map();
      elements.forEach(function (el) {
        var p = el.parentElement || document.body;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p).push(el);
      });

      byParent.forEach(function (group) {
        group.forEach(function (el, idx) {
          var cls = defaultCls;
          if (doAlternate && group.length > 1) {
            cls = idx % 2 === 0 ? 'm-reveal-left' : 'm-reveal-right';
          }
          tagElement(el, cls);
          if (group.length > 1 && !el.hasAttribute('data-delay')) {
            el.style.transitionDelay = (idx * 0.09) + 's';
          }
        });
      });
    });

    /* Legacy .reveal elements */
    container.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      if (!el.hasAttribute('data-m-anim') && !el.hasAttribute('data-m-split')) {
        el.setAttribute('data-m-anim', 'legacy');
      }
    });
  }

  function isInViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function safetyReveal(root) {
    /* Only force-reveal elements currently visible in the viewport.
       Off-screen elements stay hidden and animate when scrolled into view. */
    setTimeout(function () {
      (root || document).querySelectorAll(
        '.m-anim:not(.m-visible), .reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)'
      ).forEach(function (el) {
        if (isInViewport(el)) el.classList.add('m-visible', 'visible');
      });
      (root || document).querySelectorAll('.m-word:not(.m-w-in)').forEach(function (span) {
        if (isInViewport(span)) span.classList.add('m-w-in');
      });
    }, 1800);
  }

  function buildIO(root) {
    if (revealIO) revealIO.disconnect();

    if (reducedMotion) {
      (root || document).querySelectorAll('.m-anim, .reveal, .reveal-left, .reveal-right').forEach(function (el) {
        el.classList.add('visible', 'm-visible');
      });
      (root || document).querySelectorAll('.m-word').forEach(function (span) {
        span.classList.add('m-w-in');
      });
      return;
    }

    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('m-visible', 'visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.07,
      rootMargin: '0px 0px -20px 0px'
    });

    (root || document).querySelectorAll('[data-m-anim], .reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(function (el) {
      revealIO.observe(el);
    });

    safetyReveal(root);
  }

  /* ═══════════════════════════════════════════════
     IMAGE FADE-IN
  ═══════════════════════════════════════════════ */
  function initImageFade(root) {
    if (reducedMotion) return;
    (root || document).querySelectorAll('#page-root img:not([data-m-img])').forEach(function (img) {
      img.setAttribute('data-m-img', '1');
      if (img.complete && img.naturalWidth) {
        img.classList.add('m-loaded');
      } else {
        img.addEventListener('load', function () { img.classList.add('m-loaded'); }, { once: true });
      }
    });
  }

  /* ═══════════════════════════════════════════════
     COUNTER ANIMATION
  ═══════════════════════════════════════════════ */
  function animateCount(el) {
    if (reducedMotion) return;
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var isInt  = Number.isInteger(target);
    var dur = 1600, t0 = null;
    function springEase(p) {
      /* cubic-bezier(0.34, 1.56, 0.64, 1) — slight overshoot */
      var c1 = 1.56, c2 = 0.64;
      if (p < 0.5) return 4 * p * p * p;
      var f = p - 1;
      return 1 + c1 * f * f * f + c2 * f * f;
    }
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var ease = springEase(p);
      var val = Math.max(0, target * ease);
      el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters(root) {
    var els = (root || document).querySelectorAll('[data-count]');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ═══════════════════════════════════════════════
     HERO VISUAL — scroll parallax
  ═══════════════════════════════════════════════ */
  function initHeroParallax() {
    if (reducedMotion) return;
    var visual = document.querySelector('.hero__visual');
    if (!visual) return;
    var hero = document.querySelector('.hero');
    function onScroll() {
      var scrollY = window.scrollY || window.pageYOffset;
      var heroH   = hero ? hero.offsetHeight : window.innerHeight;
      if (scrollY > heroH) return;
      visual.style.transform = 'translateY(' + (scrollY * 0.10) + 'px)';
    }
    window.removeEventListener('scroll', window._mHeroParallax);
    window._mHeroParallax = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ═══════════════════════════════════════════════
     CARD HOVER PARALLAX (subtle tilt)
  ═══════════════════════════════════════════════ */
  function initCardParallax(root) {
    if (reducedMotion) return;
    var sel = '.why-card, .mv-card, .value-card, .expect-card, .blog-card, .case-card';
    (root || document).querySelectorAll(sel).forEach(function (card) {
      if (card.hasAttribute('data-m-tilt')) return;
      card.setAttribute('data-m-tilt', '1');

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width  - 0.5;
        var y = (e.clientY - rect.top)  / rect.height - 0.5;
        card.style.transform = 'translateY(-5px) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg)';
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform 0.55s cubic-bezier(0.16,1,0.3,1), box-shadow 0.55s ease, border-color 0.55s ease';
        setTimeout(function () { card.style.transition = ''; }, 560);
      }, { passive: true });
    });
  }

  /* ═══════════════════════════════════════════════
     BUTTON RIPPLE — click effect
  ═══════════════════════════════════════════════ */
  function initRipple(root) {
    if (reducedMotion) return;
    (root || document).querySelectorAll('.btn:not([data-m-ripple])').forEach(function (btn) {
      btn.setAttribute('data-m-ripple', '1');
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var wave = document.createElement('span');
        wave.className = 'm-ripple-wave';
        wave.style.top  = (e.clientY - rect.top)  + 'px';
        wave.style.left = (e.clientX - rect.left) + 'px';
        btn.appendChild(wave);
        wave.addEventListener('animationend', function () { wave.remove(); }, { once: true });
      }, { passive: true });
    });
  }

  /* ═══════════════════════════════════════════════
     PAGE ENTER / EXIT (router hooks)
  ═══════════════════════════════════════════════ */
  window.mAnimExit = function () {
    if (reducedMotion) return;
    var root = document.getElementById('page-root');
    if (root) { root.classList.remove('m-visible'); root.classList.add('m-exit'); }
  };

  window.mAnimEnter = function () {
    var pageRoot = document.getElementById('page-root');
    applyWordSplits(pageRoot);
    autoTag(pageRoot);
    buildIO(pageRoot);
    initImageFade(pageRoot);
    initCounters(pageRoot);
    initCardParallax(pageRoot);
    initRipple(pageRoot);
    initHeroParallax();
    /* Re-init the abstract AI network canvas for the newly-swapped page */
    if (typeof window.mInitTechNet === 'function') window.mInitTechNet();
    pageEnter();
  };

  function pageEnter() {
    var root = document.getElementById('page-root');
    if (!root) return;
    var fromSpa = root.classList.contains('m-exit');
    root.classList.remove('m-exit', 'm-visible');
    if (!fromSpa || reducedMotion) {
      root.classList.add('m-visible');
      return;
    }
    root.classList.add('m-enter');
    setTimeout(function () {
      root.classList.remove('m-enter');
      root.classList.add('m-visible');
    }, 20);
  }

  /* ═══════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════ */
  function init() {
    initProgress();
    applyWordSplits(document);
    autoTag(document);
    buildIO(document);
    initImageFade(document);
    initCounters(document);
    initCardParallax(document);
    initRipple(document);
    initHeroParallax();
    pageEnter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* ═══════════════════════════════════════════════
   ABSTRACT AI NETWORK — shared inner-page hero bg
   Idempotent + re-runnable so the SPA router can re-init
   the canvas after every navigation (see mAnimEnter).
   Runs for every <canvas class="tech-net">.
═══════════════════════════════════════════════ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initNet(canvas) {
    if (canvas.dataset.netInit === '1') return;   // already running for this element
    canvas.dataset.netInit = '1';

    var ctx = canvas.getContext('2d');
    var W, H, DPR, nodes, mouse = { x: -9999, y: -9999 };
    var animate = !reduced;

    function size() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      size();
      var count = Math.max(38, Math.min(110, Math.floor((W * H) / 10000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-0.2, 0.2), vy: rand(-0.2, 0.2),
          r: rand(1.1, 2.5),
          gold: Math.random() < 0.28
        });
      }
    }

    var LINK = 165;
    function frame() {
      /* Stop cleanly once this canvas is removed from the DOM (SPA nav) */
      if (!canvas.isConnected) { window.removeEventListener('resize', build); return; }
      ctx.clearRect(0, 0, W, H);
      var i, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        var dxm = mouse.x - n.x, dym = mouse.y - n.y;
        if (Math.hypot(dxm, dym) < 170) { n.x += dxm * 0.0016; n.y += dym * 0.0016; }
      }
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var p = nodes[a], q = nodes[b];
          var d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < LINK) {
            var t = 1 - d / LINK, g = p.gold || q.gold;
            ctx.strokeStyle = g
              ? 'rgba(240,165,0,' + (t * 0.45).toFixed(3) + ')'
              : 'rgba(70,205,165,' + (t * 0.40).toFixed(3) + ')';
            ctx.lineWidth = g ? 1.1 : 0.8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k];
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        if (nd.gold) { ctx.fillStyle = 'rgba(244,183,51,0.95)'; ctx.shadowColor = 'rgba(240,165,0,0.8)'; ctx.shadowBlur = 10; }
        else { ctx.fillStyle = 'rgba(120,214,180,0.85)'; ctx.shadowColor = 'rgba(52,190,150,0.55)'; ctx.shadowBlur = 7; }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      if (animate) requestAnimationFrame(frame);
    }

    build();
    if (animate) requestAnimationFrame(frame);  /* self-scheduling loop */
    else frame();                               /* reduced-motion: one static frame */

    window.addEventListener('resize', build, { passive: true });
    var host = canvas.parentElement;
    if (host) {
      host.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      }, { passive: true });
      host.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; }, { passive: true });
    }
  }

  /* Exposed so the SPA router (via mAnimEnter) can re-init after each nav */
  window.mInitTechNet = function () {
    document.querySelectorAll('canvas.tech-net').forEach(initNet);
  };

  window.mInitTechNet();
})();

/* =====================================================================
   IgnizAI — Home hero "growth engine"
   The headline stays fixed. The dashboard walks through five connected
   stages (Build → Get found → Automate → Capture → Grow). A rail on top
   fills as the engine progresses; each stage replays its infographic.
   Auto-advances every 4.5s, with a pause button; click or arrow-key the
   rail to jump. Pauses when the hero is off-screen. Reduced motion: no
   auto-advance, numbers shown at once.
   ===================================================================== */
(function () {
  'use strict';
  var hero = document.getElementById('hero');
  if (!hero || !hero.classList.contains('hx')) return;

  var steps = [].slice.call(hero.querySelectorAll('.hx__step')),
      caps = [].slice.call(hero.querySelectorAll('.hx__cap-item')),
      slides = [].slice.call(hero.querySelectorAll('.hx__slide')),
      scenes = [].slice.call(hero.querySelectorAll('.hx__scene')),
      fill = hero.querySelector('.hx__rail-fill'),
      pauseBtn = hero.querySelector('.hx__pause');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 4500, N = steps.length, cur = 0, elapsed = 0, last = 0, paused = reduce, visible = true;
  var lang = function () { return document.documentElement.lang === 'ar' ? 'ar-AE' : 'en-US'; };

  function countUp(scene) {
    [].forEach.call(scene.querySelectorAll('[data-count]'), function (el) {
      var to = parseFloat(el.getAttribute('data-count')), dec = +el.getAttribute('data-dec') || 0;
      var fmt = function (v) { return v.toLocaleString(lang(), { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
      if (reduce) { el.textContent = fmt(to); return; }
      var t0 = 0, d = 1300, delay = 300;
      el.textContent = fmt(0);
      (function step(t) {
        if (!scene.classList.contains('is-active')) return;
        if (!t0) t0 = t;
        var k = Math.min(1, Math.max(0, (t - t0 - delay) / d));
        el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }

  function setFill(k) {
    /* line runs from the first stage to the last: 0 … 1 */
    var p = Math.min(1, (cur + k) / (N - 1));
    fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  function go(i, focus) {
    cur = (i + N) % N; elapsed = 0;
    steps.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle('is-active', on);
      s.classList.toggle('is-done', k < cur);
      s.setAttribute('aria-selected', on ? 'true' : 'false');
      s.tabIndex = on ? 0 : -1;
    });
    caps.forEach(function (c, k) { c.classList.toggle('is-active', k === cur); });
    slides.forEach(function (s, k) {
      var on = k === cur;
      s.classList.toggle('is-active', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
    });
    scenes.forEach(function (s, k) {
      s.classList.remove('is-active');
      if (k === cur) { void s.offsetWidth; s.classList.add('is-active'); countUp(s); }
    });
    setFill(0);
    if (focus) steps[cur].focus();
  }

  function tick(t) {
    requestAnimationFrame(tick);
    if (!last) last = t;
    var dt = t - last; last = t;
    if (paused || !visible) return;
    elapsed += dt;
    setFill(Math.min(1, elapsed / DUR));
    if (elapsed >= DUR) go(cur + 1);
  }

  steps.forEach(function (s, k) {
    s.addEventListener('click', function () { go(k); });
    s.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1, true); }
      else if (e.key === 'Home') { e.preventDefault(); go(0, true); }
      else if (e.key === 'End') { e.preventDefault(); go(N - 1, true); }
    });
  });
  function setPaused(v) {
    paused = v; last = 0;
    pauseBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', v ? 'Play animation' : 'Pause animation');
    hero.classList.toggle('hx--paused', v);
  }
  if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
  if (reduce) setPaused(true);
  document.addEventListener('visibilitychange', function () { last = 0; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; last = 0; }, { threshold: 0.2 }).observe(hero);
  }

  /* Arabic copy */
  if (window.IgnizAII18n && IgnizAII18n.extend) {
    IgnizAII18n.extend({
      'We build the website, automations and lead systems that': 'نبني الموقع والأتمتة وأنظمة العملاء التي',
      'grow your revenue.': 'تنمّي إيراداتك.',
      'From a fast, findable website to AI that answers every enquiry — one connected growth engine, designed and run by one team.': 'من موقع سريع يسهل العثور عليه إلى ذكاء اصطناعي يردّ على كل استفسار — محرّك نموّ متكامل يصمّمه ويديره فريق واحد.',
      'Website building': 'بناء المواقع', 'Digital presence': 'الحضور الرقمي', 'AI automation': 'أتمتة بالذكاء الاصطناعي', 'Lead generation': 'توليد العملاء المحتملين', 'Revenue growth': 'نمو الإيرادات',
      'Websites built to be noticed —': 'مواقع تُصمَّم لتلفت الأنظار —', 'and to perform.': 'وتحقّق النتائج.',
      'Fast, mobile-first websites designed around what you want every visitor to do next.': 'مواقع سريعة ومصمّمة للجوال أولاً، مبنيّة حول الخطوة التالية التي تريدها من كل زائر.',
      'Be found where your customers': 'كن حاضراً حيث يبحث', 'are looking.': 'عملاؤك.',
      'Google Search, Maps and social profiles that work together, so the right people find you first.': 'بحث Google والخرائط وحسابات التواصل تعمل معاً، ليجدك العملاء المناسبون أولاً.',
      'Let AI handle': 'دع الذكاء الاصطناعي', 'the busywork.': 'يتولّى المهام الروتينية.',
      'Assistants and workflows that answer enquiries, update your CRM and book appointments — day and night.': 'مساعدون وسير عمل يردّون على الاستفسارات ويحدّثون نظام العملاء ويحجزون المواعيد — ليلاً ونهاراً.',
      'Turn visitors into': 'حوّل الزوار إلى', 'qualified enquiries.': 'استفسارات مؤهّلة.',
      'Clear calls to action, smart forms and instant follow-ups that bring you better leads, consistently.': 'دعوات واضحة لاتخاذ إجراء ونماذج ذكية ومتابعة فورية تجلب لك عملاء أفضل باستمرار.',
      'Grow revenue': 'نمِّ إيرادات', 'you can measure.': 'يمكنك قياسها.',
      "See what's working with clear analytics — then double down on the channels that pay.": 'اعرف ما ينجح عبر تحليلات واضحة — ثم ضاعف جهودك في القنوات المربحة.',
      'Chat on WhatsApp': 'تواصل عبر واتساب',
      'From AED 6,250': 'ابتداءً من 6,250 درهم',
      'Website packages': 'باقات المواقع',
      '5-in-1': '5 في 1',
      'Web · SEO · AI · Leads · Analytics': 'مواقع · SEO · ذكاء اصطناعي · عملاء · تحليلات',
      'UAE-based': 'مقرّنا الإمارات',
      'Studio in Ras Al Khaimah': 'استوديو في رأس الخيمة',
      'Your growth engine': 'محرّك نموّك',
      'Example': 'مثال',
      'Build': 'البناء', 'Get found': 'الظهور', 'Automate': 'الأتمتة', 'Capture': 'الاستقطاب', 'Grow': 'النموّ',
      '01 · Build': '01 · البناء', '02 · Get found': '02 · الظهور', '03 · Automate': '03 · الأتمتة', '04 · Capture': '04 · الاستقطاب', '05 · Grow': '05 · النموّ',
      'A fast, mobile-first website that turns visits into action.': 'موقع سريع مصمّم للجوال أولاً يحوّل الزيارات إلى إجراءات.',
      'Google Search, Maps and social profiles working together.': 'بحث Google والخرائط وحسابات التواصل تعمل معاً.',
      'AI answers enquiries, updates your CRM and books appointments — 24/7.': 'الذكاء الاصطناعي يردّ على الاستفسارات ويحدّث نظام العملاء ويحجز المواعيد — على مدار الساعة.',
      'Smart forms and instant follow-up turn visitors into qualified leads.': 'نماذج ذكية ومتابعة فورية تحوّل الزوار إلى عملاء مؤهّلين.',
      'Clear analytics show what pays, so you can double down on it.': 'تحليلات واضحة تُظهر ما يحقّق العائد لتضاعف جهودك فيه.'
    });
  }

  go(0);
  requestAnimationFrame(tick);
})();

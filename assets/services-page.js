/* IgnizAI — Services page: scroll-spy for the service navigator (works scrolling down and up) */
(function () {
  'use strict';
  var links = [].slice.call(document.querySelectorAll('.sv-nav__link'));
  if (!links.length) return;
  var blocks = links.map(function (l) { return document.getElementById(l.getAttribute('data-target')); });
  var raf = 0;
  function update() {
    raf = 0;
    var line = window.innerHeight * 0.38, cur = 0;
    blocks.forEach(function (b, i) { if (b && b.getBoundingClientRect().top <= line) cur = i; });
    links.forEach(function (l, i) {
      var on = i === cur;
      if (on !== l.classList.contains('is-active')) {
        l.classList.toggle('is-active', on);
        if (on && l.scrollIntoView && window.innerWidth <= 1000) {
          var list = l.closest('.sv-nav__list');
          if (list) list.scrollTo({ left: l.offsetLeft - 16, behavior: 'smooth' });
        }
      }
      l.setAttribute('aria-current', on ? 'true' : 'false');
    });
  }
  window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  if (window.IgnizAII18n && IgnizAII18n.extend) {
    IgnizAII18n.extend({
      'Everything your business needs to': 'كل ما يحتاجه عملك', 'grow online.': 'لينمو على الإنترنت.',
      'Five connected services — from the website itself to the AI, leads and reporting behind it — designed, built and cared for by one senior team.': 'خمس خدمات مترابطة — من الموقع نفسه إلى الذكاء الاصطناعي والعملاء والتقارير خلفه — يصمّمها ويبنيها ويرعاها فريق واحد من الخبراء.',
      'See packages & prices': 'الباقات والأسعار', 'Your growth stack': 'منظومة نموّك', 'Live': 'مباشر', 'Built by': 'من تنفيذ', 'One senior team': 'فريق خبراء واحد', 'Packages from': 'الباقات تبدأ من', 'AED 6,250': '6,250 درهم',
      'Website building': 'بناء المواقع', 'Digital presence': 'الحضور الرقمي', 'AI automation': 'أتمتة بالذكاء الاصطناعي', 'Lead generation': 'توليد العملاء المحتملين', 'Revenue growth': 'نمو الإيرادات', 'Revenue growth & care': 'نمو الإيرادات والرعاية',
      'Five services': 'خمس خدمات', 'Not sure which?': 'لست متأكداً؟', 'Ask us →': 'اسألنا ←', "What's included": 'ما الذي يشمله', 'Comes with': 'متوفّر في', 'Compare packages →': 'قارن الباقات ←',
      'High-craft websites and web apps, designed and built from scratch.': 'مواقع وتطبيقات ويب متقنة، تُصمَّم وتُبنى من الصفر.',
      'Be found where your customers are already looking.': 'كن حاضراً حيث يبحث عملاؤك بالفعل.',
      'Practical AI, only where it earns its place.': 'ذكاء اصطناعي عملي، فقط حيث يستحق مكانه.',
      'Turn visitors into qualified enquiries.': 'حوّل الزوار إلى استفسارات مؤهّلة.',
      'The quiet work that keeps you ahead.': 'العمل الهادئ الذي يبقيك في المقدّمة.',
      'Ignite Basic, Business or Premium': 'Ignite Basic أو Business أو Premium', 'Ignite Business or Premium': 'Ignite Business أو Premium', 'Ignite Intelligence': 'Ignite Intelligence',
      'Ignite Business or Intelligence': 'Ignite Business أو Intelligence', 'Any package, as an ongoing plan': 'أي باقة، كخطة مستمرة',
      'Performance first': 'الأداء أولاً', 'Secure by default': 'آمن افتراضياً', 'Bilingual-ready': 'جاهز بلغتين', 'SEO foundations': 'أسس تحسين البحث', 'You own it': 'ملكك بالكامل', 'Built to grow': 'مبني للنمو',
      'Not sure where to': 'لا تعرف من أين', 'start?': 'تبدأ؟', 'Chat on WhatsApp': 'تواصل عبر واتساب',
      "Tell us the goal, not the spec. We'll come back with an honest read on what's worth building — and which package fits.": 'أخبرنا بالهدف لا بالمواصفات، وسنعود إليك برأي صريح حول ما يستحق البناء — والباقة المناسبة.'
    });
  }
})();

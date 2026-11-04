/* IgnizAI — Work · About · Process · Journal: filters + Arabic copy */
(function () {
  'use strict';
  /* category filters (Work projects, Journal articles) */
  [].forEach.call(document.querySelectorAll('.pg-filter'), function (bar) {
    var scope = bar.closest('section') || document;
    var items = [].slice.call(scope.querySelectorAll('[data-cat]'));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.pg-filter__btn'); if (!b) return;
      var f = b.getAttribute('data-filter');
      [].forEach.call(bar.querySelectorAll('.pg-filter__btn'), function (x) {
        var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      items.forEach(function (it) {
        var show = f === 'all' || it.getAttribute('data-cat') === f;
        it.classList.toggle('pg-hide', !show);
        if (show) it.classList.add('is-in');
      });
    });
  });

  if (!window.IgnizAII18n || !IgnizAII18n.extend) return;
  IgnizAII18n.extend({
    'Start a Project': 'ابدأ مشروعاً', 'Chat on WhatsApp': 'تواصل عبر واتساب', "Let's begin": 'لنبدأ',
    /* work */
    'Real projects,': 'مشاريع حقيقية،', 'built to work.': 'مبنيّة لتعمل.', 'Browse the projects': 'تصفّح المشاريع',
    'live projects': 'مشاريع مباشرة', 'industries': 'قطاعات', 'product of our own': 'منتج خاص بنا',
    'All work': 'كل الأعمال', 'FinTech': 'التقنية المالية', 'Travel': 'السفر', 'Healthcare': 'الرعاية الصحية', 'Real estate': 'العقارات', 'Food & beverage': 'الأغذية والمشروبات',
    'Goal': 'الهدف', 'Visit site': 'زيارة الموقع', 'Your project could be': 'قد يكون مشروعك', 'next.': 'التالي.',
    /* about */
    'Built to': 'مبنيّ لكي', 'stay': 'يبقى', ', not just to ship.': '، لا ليُسلَّم فقط.', 'See our work': 'شاهد أعمالنا', 'IgnizAI at a glance': 'IgnizAI في لمحة',
    'Studio': 'الاستوديو', 'Ras Al Khaimah, UAE': 'رأس الخيمة، الإمارات', 'Languages': 'اللغات', 'English & Arabic': 'الإنجليزية والعربية', 'What we do': 'ما نقدّمه',
    '5 connected services': '5 خدمات مترابطة', 'Our own product': 'منتجنا الخاص', 'Who you work with': 'مع من تعمل', 'The people doing the work': 'الأشخاص الذين ينفّذون العمل',
    'Our story': 'قصتنا', 'Mission': 'المهمة', 'Vision': 'الرؤية', "What we've built": 'ما بنيناه', 'Proof, not': 'دليل، لا', 'promises.': 'وعود.', 'See all our work →': 'شاهد جميع أعمالنا ←',
    "Let's build something worth": 'لنبنِ شيئاً يستحق', 'keeping.': 'البقاء.',
    /* process */
    'Walk through the five stages': 'استعرض المراحل الخمس', 'Your project, stage by stage': 'مشروعك، مرحلة بمرحلة', 'On track': 'في المسار',
    'Discover': 'الاكتشاف', 'Design': 'التصميم', 'Build': 'البناء', 'Launch': 'الإطلاق', 'Care': 'الرعاية',
    'Regular check-ins': 'متابعة منتظمة', 'Live preview link': 'رابط معاينة مباشر', 'What you can expect': 'ما يمكنك توقّعه',
    'Informed, in control,': 'على اطّلاع، ومتحكّم،', 'confident.': 'وواثق.', 'A working link from early on': 'رابط عمل منذ البداية',
    'Clear scope and pricing': 'نطاق وأسعار واضحة', 'A team that can run it': 'فريق قادر على إدارته', 'Ready when': 'جاهزون متى', 'you are.': 'كنت جاهزاً.',
    /* journal */
    'Browse all articles': 'تصفّح جميع المقالات', 'All articles': 'جميع المقالات', 'Digital Growth': 'النمو الرقمي', 'Business Growth': 'نمو الأعمال', 'Lead Generation': 'توليد العملاء',
    'Practical guides for': 'أدلة عملية', 'growing businesses.': 'للشركات النامية.', 'Read the article': 'اقرأ المقال', 'Read': 'اقرأ',
    'Enjoyed the read? Let\'s': 'أعجبتك القراءة؟ لنتحدث', 'talk shop.': 'في العمل.'
  });
})();

/* IgnizAI — Home page: Arabic copy for the redesigned sections */
(function () {
  'use strict';
  /* What we do: pop the four right-hand cards up in sequence when the grid scrolls into view */
  var grid = document.querySelector('.hm-svc__grid');
  if (grid && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('hm-js');
    var io = new IntersectionObserver(function (en) {
      /* replay every time the grid comes into view — scrolling down or back up */
      en.forEach(function (e) { grid.classList.toggle('is-popped', e.isIntersecting); });
    }, { threshold: 0.2 });
    io.observe(grid);
  }
  /* Selected work: give each slide its own screenshot as a blurred backdrop tint */
  [].forEach.call(document.querySelectorAll('#work-showcase .work-card'), function (c) {
    var img = c.querySelector('.work-card__shot img');
    if (img) c.style.setProperty('--shot', 'url("' + img.src + '")');   /* absolute URL: a relative one resolves against home.css */
  });
  if (!window.IgnizAII18n || !IgnizAII18n.extend) return;
  IgnizAII18n.extend({
    'Built for growing UAE businesses': 'مصمّم للشركات النامية في الإمارات',
    'Clinics & healthcare': 'العيادات والرعاية الصحية', 'Real estate': 'العقارات', 'Travel & tourism': 'السفر والسياحة',
    'Food & beverage': 'الأغذية والمشروبات', 'Retail & e-commerce': 'التجزئة والتجارة الإلكترونية', 'Professional services': 'الخدمات المهنية', 'Professional services & consultancy': 'الخدمات المهنية والاستشارات', 'Finance & banking': 'المالية والمصارف', 'Education': 'التعليم', 'Hospitality': 'الضيافة', 'Engineering & infrastructure': 'الهندسة والبنية التحتية',
    'One team for your whole': 'فريق واحد لكامل', 'growth engine.': 'محرّك نموّك.',
    'Five connected services that build on each other — from the first visit to the next sale.': 'خمس خدمات مترابطة يكمّل بعضها بعضاً — من الزيارة الأولى إلى البيعة التالية.',
    'Website building': 'بناء المواقع', 'Digital presence': 'الحضور الرقمي', 'AI automation': 'أتمتة بالذكاء الاصطناعي', 'Lead generation': 'توليد العملاء المحتملين', 'Revenue growth': 'نمو الإيرادات',
    'Fast, mobile-first websites and web apps — designed and built from scratch around what you want visitors to do next.': 'مواقع وتطبيقات ويب سريعة ومصمّمة للجوال أولاً — تُبنى من الصفر حول ما تريد أن يفعله الزائر بعد ذلك.',
    'Google Search, Maps and social profiles that work together, so the right people find you first.': 'بحث Google والخرائط وحسابات التواصل تعمل معاً، ليجدك العملاء المناسبون أولاً.',
    'Assistants and workflows that answer enquiries, update your CRM and book appointments — day and night.': 'مساعدون وسير عمل يردّون على الاستفسارات ويحدّثون نظام العملاء ويحجزون المواعيد — ليلاً ونهاراً.',
    'Clear calls to action, smart forms and instant follow-up that turn visitors into qualified enquiries.': 'دعوات واضحة لاتخاذ إجراء ونماذج ذكية ومتابعة فورية تحوّل الزوار إلى استفسارات مؤهّلة.',
    'Simple dashboards and monthly insights show what pays — then we double down on it with you.': 'لوحات بسيطة ورؤى شهرية تُظهر ما يحقّق العائد — ثم نضاعف الجهد فيه معك.',
    'Custom design': 'تصميم مخصّص', 'Mobile-first': 'الجوال أولاً', 'Speed & SEO': 'السرعة وتحسين البحث', 'Google Business Profile': 'ملف Google التجاري',
    'Local SEO': 'تحسين البحث المحلي', 'AI chat': 'محادثة ذكية', 'WhatsApp': 'واتساب', 'Smart forms': 'نماذج ذكية', 'Lead magnets': 'محفّزات جذب',
    'Analytics': 'التحليلات', 'Care & SEO': 'الرعاية وتحسين البحث', 'Explore': 'اكتشف',
    'How we work': 'كيف نعمل', 'Five clear steps,': 'خمس خطوات واضحة،', 'no black box.': 'بلا غموض.', 'See our process →': 'تعرّف على منهجيتنا ←',
    'Discover': 'الاكتشاف', 'Design': 'التصميم', 'Build': 'البناء', 'Launch': 'الإطلاق', 'Care': 'الرعاية',
    'We learn how you make money, who you serve and what "better" looks like.': 'نتعرّف على مصادر دخلك ومن تخدم وكيف يبدو "الأفضل" بالنسبة لك.',
    'You see and shape the structure and look early, while change is cheap.': 'ترى الهيكل والشكل مبكراً وتشارك في صياغته، حين يكون التغيير سهلاً.',
    'Clean, fast, accessible code — with a live link to watch it come together.': 'كود نظيف وسريع وسهل الوصول — مع رابط مباشر لمتابعة التقدّم.',
    'Tested across devices, tuned for speed and SEO, launched carefully.': 'اختبار على جميع الأجهزة، وضبط للسرعة وتحسين البحث، وإطلاق مدروس.',
    'We monitor, maintain and improve, so the work keeps paying off.': 'نراقب ونصون ونحسّن، ليستمر العمل في تحقيق العائد.',
    'Packages': 'الباقات', 'Clear packages,': 'باقات واضحة،', 'clear prices.': 'وأسعار واضحة.', 'Compare all packages →': 'قارن جميع الباقات ←',
    'Starter': 'باقة الانطلاق', 'Bestseller': 'الأكثر مبيعاً', 'Top pick': 'الخيار الأفضل', 'AI-powered': 'مدعوم بالذكاء الاصطناعي',
    'A sharp, mobile-ready landing page to get you online fast.': 'صفحة هبوط أنيقة وجاهزة للجوال لتنطلق على الإنترنت بسرعة.',
    'A complete multi-page website built to win enquiries.': 'موقع متكامل متعدد الصفحات مصمّم لكسب الاستفسارات.',
    'A larger, on-brand, bilingual site with advanced motion.': 'موقع أكبر بهوية علامتك وبلغتين مع حركة متقدّمة.',
    'Bookings, payments, CRM and AI — added to your website.': 'الحجوزات والمدفوعات وCRM والذكاء الاصطناعي — مضافة إلى موقعك.',
    'From AED': 'ابتداءً من درهم', 'View details': 'عرض التفاصيل',
    "All prices in AED. Domain and hosting may be billed at the provider's current market rate.": 'جميع الأسعار بالدرهم الإماراتي. قد يُحتسب النطاق والاستضافة وفق السعر السوقي الحالي لمزوّد الخدمة.',
    'Questions': 'أسئلة', 'Good to': 'من المفيد أن', 'know.': 'تعرف.',
    'Still unsure?': 'لا تزال متردداً؟', 'Ask us directly': 'اسألنا مباشرة', 'or message us on WhatsApp.': 'أو راسلنا على واتساب.',
    'How much does a website cost?': 'كم تبلغ تكلفة الموقع؟',
    "Our packages start at AED 6,250 for Ignite Basic, AED 18,050 for Ignite Business and AED 45,250 for Ignite Premium. Ignite Intelligence — bookings, payments, CRM and AI — is AED 22,100. Domain and hosting may be billed at the provider's current market rate.": 'تبدأ باقاتنا من 6,250 درهم لباقة Ignite Basic، و18,050 درهم لباقة Ignite Business، و45,250 درهم لباقة Ignite Premium. أما Ignite Intelligence — الحجوزات والمدفوعات وCRM والذكاء الاصطناعي — فبسعر 22,100 درهم. قد يُحتسب النطاق والاستضافة وفق السعر السوقي الحالي لمزوّد الخدمة.',
    'Can my website be in both English and Arabic?': 'هل يمكن أن يكون موقعي بالعربية والإنجليزية؟',
    'Yes. Ignite Premium is a bilingual site and includes English to Arabic translation, and Ignite Intelligence can add a bilingual chatbot.': 'نعم. باقة Ignite Premium موقع ثنائي اللغة وتشمل الترجمة من الإنجليزية إلى العربية، ويمكن لباقة Ignite Intelligence إضافة روبوت محادثة ثنائي اللغة.',
    'Can you add AI to the business I already have?': 'هل يمكنكم إضافة الذكاء الاصطناعي إلى عملي الحالي؟',
    'Yes. Ignite Intelligence adds AI to your website — an AI chatbot for FAQs, lead qualification, booking, payments and CRM integration.': 'نعم. تضيف باقة Ignite Intelligence الذكاء الاصطناعي إلى موقعك — روبوت محادثة للأسئلة الشائعة، وتأهيل العملاء، والحجز، والمدفوعات، والربط مع CRM.',
    'What happens after launch?': 'ماذا يحدث بعد الإطلاق؟',
    'Launch is the beginning. With Care & Growth we handle maintenance and updates, uptime and performance monitoring, SEO and priority support.': 'الإطلاق مجرد بداية. مع خدمة الرعاية والنمو نتولّى الصيانة والتحديثات، ومراقبة التوفّر والأداء، وتحسين البحث، والدعم ذي الأولوية.',
    "Tell us the goal, not the spec. We'll come back with an honest read on what's worth building.": 'أخبرنا بالهدف لا بالمواصفات، وسنعود إليك برأي صريح حول ما يستحق البناء.',
    'Stage': 'المرحلة', 'Next: Design →': 'التالي: التصميم ←', 'Next: Build →': 'التالي: البناء ←', 'Next: Launch →': 'التالي: الإطلاق ←', 'Next: Care →': 'التالي: الرعاية ←',
    'And it keeps going —': 'ويستمر العمل —', 'see the full process →': 'شاهد المنهجية كاملة ←',
    'Our product · FinTech SaaS': 'منتجنا · برمجيات مالية كخدمة',
    'Our own SaaS for lenders in India: it turns a password-locked bank statement PDF into a 141-metric Excel report, a risk score and a dashboard — in about a minute.': 'منصّتنا الخاصة للمقرضين في الهند: تحوّل كشف الحساب البنكي المحمي بكلمة مرور إلى تقرير Excel من 141 مؤشراً ودرجة مخاطر ولوحة معلومات — في نحو دقيقة.',
    'Reads statements from 15 Indian banks': 'تقرأ كشوف 15 بنكاً هندياً', '13 validation checks before any charge': '13 فحص تحقق قبل أي رسوم',
    '141 metrics in an 8-sheet Excel report': '141 مؤشراً في تقرير Excel من 8 أوراق', 'Risk score and on-screen dashboard': 'درجة مخاطر ولوحة معلومات',
    'FinTech SaaS · built and run by IgnizAI': 'برمجيات مالية كخدمة · من تطوير وتشغيل IgnizAI',
    'Turn hours of manual statement checking into a report in about a minute': 'تحويل ساعات من مراجعة الكشوف يدوياً إلى تقرير في نحو دقيقة',
    'Chat on WhatsApp': 'تواصل عبر واتساب'
  });
})();

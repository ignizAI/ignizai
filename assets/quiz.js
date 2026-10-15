/* =====================================================================
   IgnizAI — Digital Growth Quiz
   Lives in the "We build the few things that matter" section of the home page
   (#growthQuiz). One question per screen → name & mobile (with a privacy notice) →
   rule-based recommendations with a 3-step roadmap → "Connect with IgnizAI"
   opens the Contact page form (contact.html?embed=1) in a pop-up, pre-filled.

   File layout
     1. CONFIG            — lead integration point, thresholds
     2. SERVICES          — the 7 services, their copy, roadmap phase, page link
     3. REASONS           — "why it may be relevant" sentences, keyed by trigger
     4. QUESTIONS         — questions, options, icons and SCORING WEIGHTS
     5. ENGINE            — score(), recommend(), summary(), roadmap()
     6. UI                — rendering, navigation, validation, focus, details step, pop-up
     7. ARABIC            — translations handed to the site's i18n (assets/i18n.js)

   Scoring in one sentence: every answer adds (or subtracts) points to the
   services it is relevant to; services scoring at least MIN_SCORE and at least
   REL_SHARE of the top score are recommended (max 3), ranked by score, then by
   number of supporting answers, then by SERVICE_ORDER. If nothing reaches
   MIN_SCORE, the visitor gets a general assessment + consultation instead.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('growthQuiz');
  if (!root) return;

  /* ------------------------------------------------------------------ 1. CONFIG */
  var CONFIG = {
    /* LEAD INTEGRATION POINT — the same Google Apps Script web app the Contact
       page uses (rows land in the "IgnizAI_Leads" sheet). Set to '' to disable
       online submission; the form then says so instead of pretending to send. */
    LEAD_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwnTk1MsfW72vzh2r_q3mb2faWh3NoDAOdH5qo09jDlsCQ97qKDNHEfsWO5pOysQY-W/exec',
    CONTACT_EMAIL: 'tech@ignizai.com',
    /* Answer photos: free-licence Unsplash photos (unsplash.com/license), served from Unsplash's
       image CDN at a small cropped size. A file in PHOTO_DIR named <question>-<answer>.jpg
       (e.g. assets/quiz/industry-realestate.jpg) is used instead when PHOTOS has no entry. */
    PHOTO_CDN: 'https://images.unsplash.com/',
    PHOTO_PARAMS: '?auto=format&fit=crop&w=520&h=320&q=68',
    PHOTO_DIR: 'assets/quiz/',
    GLOBE_TEXTURE: 'assets/quiz/earth.jpg',   /* NASA Blue Marble (public domain), 1200×600 */
    MIN_SCORE: 5,        /* a service needs at least this many points to be recommended */
    REL_SHARE: 0.22,     /* …and at least this share of the top service's score       */
    MAX_RECS: 3
  };

  var PHOTOS = {
    'industry-realestate': 'photo-1758193431355-54df41421657',
    'industry-health': 'photo-1629909613654-28e377c37b09',
    'industry-professional': 'photo-1714974528737-3e6c7e4d11af',
    'industry-retail': 'photo-1572611932849-7f0f116fb2f1',
    'industry-hospitality': 'photo-1625244724120-1fd1d34d00f6',
    'industry-tourism': 'photo-1638024510305-c36fcc0bf3b1',
    'industry-education': 'photo-1561089489-f13d5e730d72',
    'industry-other': 'photo-1462007895615-c8c073bebcd8',
    'website-none': 'photo-1484788984921-03950022c9ef',
    'website-outdated': 'photo-1505682634904-d7c8d95cdc50',
    'website-hard': 'photo-1668092548611-6821cd482c33',
    'website-leads': 'photo-1535261170473-22e6c4a35c43',
    'website-good': 'photo-1678690832311-bb6e361989ca',
    'discovery-referrals': 'photo-1590650046871-92c887180603',
    'discovery-google': 'photo-1488509082528-cefbba5ad692',
    'discovery-social': 'photo-1562147458-0c12e8d29f50',
    'discovery-ads': 'photo-1676491405940-9cd5d8cbf954',
    'discovery-walkins': 'photo-1627327913546-87792eb6e594',
    'discovery-unsure': 'photo-1634244034783-b776d7a7b89b',
    'challenge-enquiries': 'photo-1626863905121-3b0c0ed7b94c',
    'challenge-trust': 'photo-1638262052640-82e94d64664a',
    'challenge-content': 'photo-1515378960530-7c0da6231fb1',
    'challenge-performance': 'photo-1580106815433-a5b1d1d53d85',
    'challenge-respond': 'photo-1592890288564-76628a30a657',
    'challenge-manual': 'photo-1583521214690-73421a1829a9',
    'maintenance-none': 'photo-1471107340929-a87cd0f5b5f3',
    'maintenance-dev': 'photo-1542831371-29b0f74f9713',
    'maintenance-self': 'photo-1499914485622-a88fac536970',
    'maintenance-provider': 'photo-1522071820081-009f0129c71c',
    'maintenance-issues': 'photo-1733590634512-66186b83ad07',
    'afterhours-nextday': 'photo-1603793510575-a8cf24361baa',
    'afterhours-whatsapp': 'photo-1526045612212-70caf35c14df',
    'afterhours-forms': 'photo-1759752393975-7ca7b302fcc6',
    'afterhours-bot': 'photo-1737644467636-6b0053476bb2',
    'afterhours-none': 'photo-1566699270403-3f7e3f340664',
    'goal-launch': 'photo-1517976487492-5750f3195933',
    'goal-leads': 'photo-1730382624709-81e52dd294d4',
    'goal-visibility': 'photo-1536125434175-6c5657605fb0',
    'goal-content': 'photo-1624717369095-ebacc7d68a40',
    'goal-reliability': 'photo-1614064641938-3bbee52942c7',
    'goal-ai': 'photo-1674027444485-cec3da58eef4',
    'setup-scratch': 'photo-1712342109846-a8fcb1c883ba',
    'setup-basic': 'photo-1579869847557-1f67382cc158',
    'setup-regular': 'photo-1435527173128-983b87201f4d',
    'setup-crm': 'photo-1551288049-bebda4e38f71',
    'setup-unsure': 'photo-1429743305873-d4065c15f93e'
  };

  /* ---------------------------------------------------------------- 2. SERVICES */
  var SERVICE_ORDER = ['web', 'presence', 'cms', 'hosting', 'amc', 'chatbot', 'automation'];
  var PHASES = {
    foundation:  { rank: 1, label: 'Foundation',      line: 'Get the foundations right first.' },
    acquisition: { rank: 2, label: 'Customer growth', line: 'Attract and convert more customers.' },
    efficiency:  { rank: 3, label: 'Efficiency',      line: 'Save time with smarter processes.' },
    support:     { rank: 4, label: 'Ongoing support', line: 'Keep everything running smoothly.' }
  };
  var SERVICES = {
    web: {
      name: 'Website Development & Redesign', phase: 'foundation', link: 'services.html#websites',
      benefit: 'A credible, modern website that presents your business clearly and turns visits into enquiries.',
      help: 'We design and build fast, mobile-friendly websites from scratch, structured around what you want visitors to do next.'
    },
    presence: {
      name: 'Lead-Generating Website & Digital Presence', phase: 'acquisition', link: 'services.html#websites',
      benefit: 'More people find you, trust what they see, and get in touch.',
      help: 'We set up search-friendly pages, clear calls to action, enquiry forms and the essentials that help you show up and convert.'
    },
    cms: {
      name: 'Content Management System (CMS)', phase: 'efficiency', link: 'services.html#cms',
      benefit: 'Update pages, services and blog posts yourself, without waiting on a developer.',
      help: 'We build an easy editing system with guardrails, so your team can make changes safely and keep the design intact.'
    },
    hosting: {
      name: 'Hosting & Website Reliability', phase: 'foundation', link: 'services.html#care',
      benefit: 'A fast, secure website that stays online, with backups in place.',
      help: 'We set up dependable hosting, domain, SSL and backups, and tune your site for speed and stability.'
    },
    amc: {
      name: 'Annual Maintenance Contract (AMC)', phase: 'support', link: 'services.html#care',
      benefit: 'A reliable partner who keeps your website updated, secure and running smoothly.',
      help: 'We handle updates, monitoring, fixes and small content changes on an agreed annual plan.'
    },
    chatbot: {
      name: 'AI Chatbot & Customer Support', phase: 'acquisition', link: 'services.html#ai',
      benefit: 'Instant answers for customers at any hour, and fewer repetitive questions for your team.',
      help: 'We build a chatbot trained on your services and FAQs that captures enquiries and hands warm leads to your team.'
    },
    automation: {
      name: 'Business Automation & AI Integration', phase: 'efficiency', link: 'services.html#ai',
      benefit: 'Less time on repetitive tasks and smoother day-to-day workflows.',
      help: 'We connect your website, forms, CRM and tools so routine steps like follow-ups, routing and updates happen automatically.'
    }
  };

  /* ----------------------------------------------------------------- 3. REASONS */
  var REASONS = {
    noSite:            "You don't have a website yet, so customers who look you up have nowhere to land.",
    noSitePresence:    "Without a website, it's harder to appear in search results or look established next to competitors.",
    outdated:          'Your current website may look dated, which can quietly cost you trust.',
    credibility:       'You want to build trust, and a polished website is often the first proof people look for.',
    launch:            'Launching a professional website is one of your goals for the next few months.',
    conversion:        "Your website gets visitors but not enough enquiries, so its structure may need rethinking.",
    lowLeads:          'You told us that more enquiries are a priority.',
    visibility:        'You want to be easier to find online.',
    referrals:         'Most customers find you through referrals, and a strong online presence helps them check you out and get in touch.',
    search:            'Customers find you on Google, so how you appear in search matters.',
    speed:             'Customers find you on Google, where a fast, reliable website helps you rank and convert.',
    social:            'Customers find you on social media, and a strong website turns that attention into enquiries.',
    ads:               'You use paid advertising, which works best when it lands on pages built to convert.',
    walkins:           "Customers mostly find you offline, so there's room to reach people who search online.",
    unsureDiscovery:   "You're not sure how customers find you, and a clearer online presence makes that measurable.",
    hardUpdate:        'Updating your website is difficult right now.',
    devDependency:     'You depend on a developer for every change.',
    contentGoal:       'You want to manage your content independently.',
    newSite:           'A new website needs dependable hosting, a domain and security from day one.',
    newSiteCare:       'A new website stays secure and up to date with an ongoing care plan.',
    performance:       'You mentioned technical or performance issues.',
    security:          'Website reliability and security are a priority for you.',
    maintenance:       'You need dependable, ongoing care for your website.',
    works:             'Your website works well, and ongoing care helps keep it that way.',
    selfManaged:       'You manage updates yourself, and having support on call helps when something technical comes up.',
    regular:           'You update your website regularly, so ongoing support keeps it healthy.',
    afterHours:        'Enquiries outside business hours usually wait until the next working day.',
    whatsapp:          'Customers message you on WhatsApp, and an assistant can answer common questions instantly.',
    forms:             'You already use forms or automated replies, and a chatbot can take this further.',
    noProcess:         "There isn't a consistent process for handling enquiries yet.",
    slowResponse:      'Responding quickly to customer questions is a challenge.',
    aiGoal:            'You want to use AI to automate customer interactions.',
    manualWork:        "Repetitive manual work is taking up your team's time.",
    crm:               'You already have a CRM and established processes, and automation can connect them.',
    hasBot:            'You already use automated support, so connecting it with your other tools is a natural next step.',
    basicSetup:        "You have a basic website and social media, and there's room to make them work harder.",
    industryPresence:  'In your industry, customers compare options online before getting in touch.',
    industryEnquiries: 'Businesses like yours often receive many similar questions from potential customers.',
    industryOps:       'Businesses like yours handle many orders and requests that are easy to automate.',
    industryContent:   'Schools and training providers update information often, such as dates, courses and notices.'
  };

  /* --------------------------------------------------------------- 4. QUESTIONS
     w: { service: [points, reasonTrigger] }  — negative points lower a service
     (e.g. "our website works well" lowers Website Development).
     s: an optional sentence used in the personalised summary.                    */
  var ICON = {
    building: 'M4 21V5l8-3 8 3v16M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01',
    health:   'M12 21s-7-4.5-9-9.5C1.6 7.9 4 4.5 7.4 4.5c2 0 3.6 1.1 4.6 2.6 1-1.5 2.6-2.6 4.6-2.6 3.4 0 5.8 3.4 4.4 7C19 16.5 12 21 12 21zM12 9v5M9.5 11.5h5',
    brief:    'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
    bag:      'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
    bed:      'M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3M7 10.5a1.5 1.5 0 1 0 0-.01',
    plane:    'M2 16l20-8-3 4-9 3 2 5-3-1-2-4-5 1z',
    cap:      'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6',
    dots:     'M5 12h.01M12 12h.01M19 12h.01',
    plus:     'M4 4h16v16H4zM12 8v8M8 12h8',
    clock:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    edit:     'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    trend:    'M3 17l6-6 4 4 8-8M15 7h6v6',
    check:    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
    people:   'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 5.5a3 3 0 0 1 0 5.5M18 15c2 .6 3 2.3 3 5',
    search:   'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
    chat:     'M4 5h16v11H9l-5 4z',
    megaphone:'M3 10v4h4l7 4V6L7 10zM18 9a4 4 0 0 1 0 6',
    door:     'M6 21V3h12v18M3 21h18M14 12h.01',
    question: 'M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.2-1.3 2.1V15M12 18.5h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    star:     'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    gauge:    'M4 18a8 8 0 1 1 16 0M12 18l4-6M8 14h.01M12 10h.01',
    bolt:     'M13 2L4 14h7l-1 8 9-12h-7z',
    gear:     'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    wrench:   'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
    shield:   'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    alert:    'M12 3l10 18H2zM12 10v4M12 17.5h.01',
    moon:     'M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z',
    phone:    'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    form:     'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
    bot:      'M7 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9 13h.01M15 13h.01',
    rocket:   'M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M9 15l-3-3c1-4 5-9 12-9 0 7-5 11-9 12zM15 9h.01',
    layers:   'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    seed:     'M12 21v-8M12 13c0-4 3-7 8-7 0 5-3 7-8 7zM12 15c0-3-2-5-6-5 0 4 2 5 6 5z',
    grid:     'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'
  };

  var QUESTIONS = [
    { id: 'industry', q: 'What best describes your business?', options: [
      { id: 'realestate',   label: 'Real estate',                          icon: 'building', w: { presence: [2, 'industryPresence'], chatbot: [2, 'industryEnquiries'] },
        s: 'In real estate, buyers and tenants usually research online long before they make contact.' },
      { id: 'health',       label: 'Healthcare or clinic',                 icon: 'health',   w: { presence: [1, 'industryPresence'], chatbot: [2, 'industryEnquiries'] },
        s: 'For a clinic or healthcare practice, patients look for trust signals and easy ways to book.' },
      { id: 'professional', label: 'Professional services or consultancy', icon: 'brief',    w: { presence: [2, 'industryPresence'] },
        s: 'For a consultancy or professional service, your online presence is often the first proof of expertise.' },
      { id: 'retail',       label: 'Retail or e-commerce',                 icon: 'bag',      w: { chatbot: [2, 'industryEnquiries'], automation: [1, 'industryOps'] },
        s: 'In retail and e-commerce, customers expect to browse, compare and get answers instantly.' },
      { id: 'hospitality',  label: 'Hospitality',                          icon: 'bed',      w: { presence: [1, 'industryPresence'], chatbot: [2, 'industryEnquiries'] },
        s: 'In hospitality, guests judge the experience online before they ever arrive.' },
      { id: 'tourism',      label: 'Tourism',                              icon: 'plane',    w: { presence: [1, 'industryPresence'], chatbot: [2, 'industryEnquiries'] },
        s: 'In tourism, travellers plan, compare and enquire online, often outside office hours.' },
      { id: 'education',    label: 'Education',                            icon: 'cap',      w: { cms: [1, 'industryContent'], chatbot: [1, 'industryEnquiries'] },
        s: 'In education, families compare options online and expect timely, clear information.' },
      { id: 'other',        label: 'Other',                                icon: 'dots',     w: {},
        s: "Every business is different, so we've focused on the challenges and goals you described." }
    ]},
    { id: 'website', q: 'Does your business currently have a website?', options: [
      { id: 'none',     label: 'No website yet',                              icon: 'plus',  w: { web: [6, 'noSite'], presence: [2, 'noSitePresence'], hosting: [2, 'newSite'] },
        s: "You don't have a website yet, which means people searching for you have nowhere to land." },
      { id: 'outdated', label: 'Yes, but it looks outdated',                  icon: 'clock', w: { web: [5, 'outdated'], presence: [2, 'credibility'] },
        s: 'You already have a website, but it may no longer reflect the quality of your business.' },
      { id: 'hard',     label: 'Yes, but it is difficult to update',          icon: 'edit',  w: { cms: [6, 'hardUpdate'], amc: [1, 'maintenance'] },
        s: 'You have a website, but keeping it up to date is harder than it should be.' },
      { id: 'leads',    label: 'Yes, but it does not generate enough enquiries', icon: 'trend', w: { presence: [6, 'conversion'], web: [2, 'conversion'] },
        s: "You have a website, but it isn't bringing in enough enquiries yet." },
      { id: 'good',     label: 'Yes, and it works well',                      icon: 'check', w: { web: [-4, null], amc: [1, 'works'] },
        s: 'Your website already works well, so the focus is on what comes next.' }
    ]},
    { id: 'discovery', q: 'How do most of your customers discover your business?', options: [
      { id: 'referrals', label: 'Referrals and word of mouth', icon: 'people',    w: { presence: [3, 'referrals'], web: [1, 'credibility'] } },
      { id: 'google',    label: 'Google search',               icon: 'search',    w: { presence: [2, 'search'], hosting: [1, 'speed'] } },
      { id: 'social',    label: 'Social media',                icon: 'chat',      w: { presence: [2, 'social'], web: [1, 'social'] } },
      { id: 'ads',       label: 'Paid advertising',            icon: 'megaphone', w: { presence: [3, 'ads'], web: [1, 'ads'] } },
      { id: 'walkins',   label: 'Walk-ins or existing contacts', icon: 'door',    w: { presence: [2, 'walkins'] } },
      { id: 'unsure',    label: 'We are not sure',             icon: 'question',  w: { presence: [2, 'unsureDiscovery'] } }
    ]},
    { id: 'challenge', q: 'What is your biggest business challenge right now?', options: [
      { id: 'enquiries',   label: 'Getting more customer enquiries',              icon: 'trend',  w: { presence: [5, 'lowLeads'], web: [1, 'conversion'] },
        s: 'Your biggest challenge is attracting more customer enquiries.' },
      { id: 'trust',       label: 'Building trust and credibility online',        icon: 'star',   w: { web: [4, 'credibility'], presence: [2, 'credibility'] },
        s: 'Building trust and credibility online is a priority for you.' },
      { id: 'content',     label: 'Updating website content easily',              icon: 'edit',   w: { cms: [5, 'hardUpdate'] },
        s: 'Updating content easily is holding you back.' },
      { id: 'performance', label: 'Managing website performance and maintenance', icon: 'gauge',  w: { amc: [4, 'maintenance'], hosting: [3, 'performance'] },
        s: 'Keeping your website fast, stable and maintained is a concern.' },
      { id: 'respond',     label: 'Responding to customer questions quickly',     icon: 'bolt',   w: { chatbot: [5, 'slowResponse'], automation: [1, 'slowResponse'] },
        s: 'Responding to customer questions quickly is a pressure point.' },
      { id: 'manual',      label: 'Reducing repetitive manual work',              icon: 'gear',   w: { automation: [6, 'manualWork'], chatbot: [1, 'manualWork'] },
        s: 'Repetitive manual work is taking up time your team could spend elsewhere.' }
    ]},
    { id: 'maintenance', q: 'How do you currently manage website updates and maintenance?', options: [
      { id: 'none',     label: 'We do not have a website',                   icon: 'plus',   w: { web: [2, 'noSite'], hosting: [2, 'newSite'], amc: [1, 'newSiteCare'] } },
      { id: 'dev',      label: 'We depend on a developer for every change',  icon: 'wrench', w: { cms: [4, 'devDependency'], amc: [2, 'devDependency'] } },
      { id: 'self',     label: 'We manage updates ourselves',                icon: 'edit',   w: { amc: [1, 'selfManaged'] } },
      { id: 'provider', label: 'We have a dedicated support provider',       icon: 'shield', w: { amc: [-2, null] } },
      { id: 'issues',   label: 'Our website has technical or performance issues', icon: 'alert', w: { hosting: [5, 'performance'], amc: [4, 'performance'] } }
    ]},
    { id: 'afterhours', q: 'How do you handle enquiries outside business hours?', options: [
      { id: 'nextday',  label: 'We usually respond the next working day',   icon: 'moon',  w: { chatbot: [4, 'afterHours'] } },
      { id: 'whatsapp', label: 'Customers contact us through WhatsApp',     icon: 'phone', w: { chatbot: [3, 'whatsapp'], automation: [1, 'whatsapp'] } },
      { id: 'forms',    label: 'We use forms or automated responses',       icon: 'form',  w: { chatbot: [1, 'forms'], automation: [1, 'forms'] } },
      { id: 'bot',      label: 'We have a chatbot or automated support',    icon: 'bot',   w: { chatbot: [-3, null], automation: [2, 'hasBot'] } },
      { id: 'none',     label: 'We do not have a consistent process',       icon: 'question', w: { chatbot: [4, 'noProcess'], automation: [3, 'noProcess'] } }
    ]},
    { id: 'goal', q: 'What would you most like to achieve in the next 3–6 months?', options: [
      { id: 'launch',      label: 'Launch a professional website',          icon: 'rocket', w: { web: [5, 'launch'], hosting: [2, 'newSite'] },
        s: 'In the next few months, you want to launch a professional website.' },
      { id: 'leads',       label: 'Generate more qualified leads',          icon: 'trend',  w: { presence: [5, 'lowLeads'], chatbot: [1, 'lowLeads'] },
        s: 'In the next few months, you want to generate more qualified leads.' },
      { id: 'visibility',  label: 'Improve online visibility',              icon: 'search', w: { presence: [5, 'visibility'] },
        s: 'In the next few months, you want to be easier to find online.' },
      { id: 'content',     label: 'Manage website content independently',   icon: 'edit',   w: { cms: [5, 'contentGoal'] },
        s: 'In the next few months, you want to manage your content independently.' },
      { id: 'reliability', label: 'Improve website reliability and security', icon: 'shield', w: { hosting: [4, 'security'], amc: [4, 'maintenance'] },
        s: 'In the next few months, you want a more reliable and secure website.' },
      { id: 'ai',          label: 'Automate customer interactions using AI', icon: 'bot',   w: { chatbot: [4, 'aiGoal'], automation: [4, 'aiGoal'] },
        s: 'In the next few months, you want to automate customer interactions with AI.' }
    ]},
    { id: 'setup', q: 'What is your current digital setup?', options: [
      { id: 'scratch', label: 'Starting from scratch',                          icon: 'seed',     w: { web: [3, 'noSite'], hosting: [2, 'newSite'] } },
      { id: 'basic',   label: 'Basic website and social media',                 icon: 'layers',   w: { presence: [2, 'basicSetup'], cms: [1, 'basicSetup'] } },
      { id: 'regular', label: 'Website with regular updates',                   icon: 'edit',     w: { amc: [2, 'regular'], cms: [1, 'regular'] } },
      { id: 'crm',     label: 'Website, CRM, and established digital processes', icon: 'grid',    w: { automation: [4, 'crm'], chatbot: [2, 'crm'] } },
      { id: 'unsure',  label: 'Not sure what we need',                          icon: 'question', w: {},
        s: "You're not sure what you need yet, which is exactly what a short consultation can clarify." }
    ]}
  ];

  /* ------------------------------------------------------------------ 5. ENGINE */
  function optionOf(qi, optId) {
    var opts = QUESTIONS[qi].options;
    for (var i = 0; i < opts.length; i++) if (opts[i].id === optId) return opts[i];
    return null;
  }

  /* Sum each service's points and remember which answers (reason triggers) supplied them */
  function score(answers) {
    var res = {};
    SERVICE_ORDER.forEach(function (k) { res[k] = { key: k, score: 0, hits: 0, reasons: {}, order: [] }; });
    QUESTIONS.forEach(function (q, qi) {
      var opt = optionOf(qi, answers[q.id]);
      if (!opt) return;
      Object.keys(opt.w).forEach(function (svc) {
        var pts = opt.w[svc][0], why = opt.w[svc][1], r = res[svc];
        r.score += pts;
        if (pts > 0) {
          r.hits++;
          if (why) {
            if (!(why in r.reasons)) { r.reasons[why] = 0; r.order.push(why); }
            r.reasons[why] += pts;
          }
        }
      });
    });
    return res;
  }

  /* Ranked, filtered recommendations (max 3); empty array → general assessment */
  function recommend(scores) {
    var list = SERVICE_ORDER.map(function (k) { return scores[k]; });
    list.sort(function (a, b) {
      return (b.score - a.score) || (b.hits - a.hits) || (SERVICE_ORDER.indexOf(a.key) - SERVICE_ORDER.indexOf(b.key));
    });
    var top = list[0].score;
    if (top < CONFIG.MIN_SCORE) return [];
    return list.filter(function (r) {
      return r.score >= CONFIG.MIN_SCORE && r.score >= top * CONFIG.REL_SHARE;
    }).slice(0, CONFIG.MAX_RECS);
  }

  /* Up to two strongest reasons for a recommendation */
  function reasonsFor(rec) {
    return rec.order.slice().sort(function (a, b) {
      return (rec.reasons[b] - rec.reasons[a]) || (rec.order.indexOf(a) - rec.order.indexOf(b));
    }).slice(0, 2).map(function (k) { return REASONS[k]; });
  }

  /* Personalised summary: fixed sentences chosen from the answers (no invented diagnosis) */
  function summary(answers, recs) {
    var out = [];
    ['industry', 'website', 'challenge', 'goal', 'setup'].forEach(function (qid) {
      var qi = QUESTIONS.map(function (q) { return q.id; }).indexOf(qid);
      var opt = optionOf(qi, answers[qid]);
      if (opt && opt.s) out.push(opt.s);
    });
    out.push(recs.length ? "Here's where we'd suggest focusing first."
      : "Your answers don't point to one clear gap, so the best next step is a short conversation about your plans.");
    return out;
  }

  /* Roadmap: Priority 1 is the strongest foundational need (or, if none, the strongest
     need overall); the rest follow by phase: customer growth → efficiency → ongoing support */
  function roadmap(recs) {
    if (!recs.length) return [];
    var phaseRank = function (r) { return PHASES[SERVICES[r.key].phase].rank; };
    var first = recs.filter(function (r) { return SERVICES[r.key].phase === 'foundation'; })[0] || recs[0];
    var rest = recs.filter(function (r) { return r !== first; }).sort(function (a, b) {
      return (phaseRank(a) - phaseRank(b)) || (recs.indexOf(a) - recs.indexOf(b));
    });
    return [first].concat(rest).map(function (r) { return { key: r.key, phase: SERVICES[r.key].phase }; });
  }

  /* exposed for testing and future tuning (read-only use) */
  window.IgnizGrowthQuiz = { QUESTIONS: QUESTIONS, SERVICES: SERVICES, CONFIG: CONFIG,
    score: score, recommend: recommend, summary: summary, roadmap: roadmap, reasonsFor: reasonsFor };

  /* ---------------------------------------------------------------------- 6. UI */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { step: -1, answers: {}, contact: { name: '', code: '+971', phone: '' }, sent: null };
  /* step -1 = intro, 0..7 = questions, 8 = your details, 9 = results */
  var TOTAL = QUESTIONS.length, STEPS = TOTAL + 1;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(name, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    if (cls) s.setAttribute('class', cls);
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICON[name] || ICON.dots);
    s.appendChild(p);
    return s;
  }
  var arrow = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var stage = el('div', { class: 'gq__stage' });
  var live = el('p', { class: 'gq__sr', 'aria-live': 'polite' });
  root.innerHTML = '';
  root.appendChild(stage); root.appendChild(live);

  function announce(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 60); }

  /* Keep the whole card on screen with the smallest scroll: show as much of the section
     (headline) as fits, but never let the card's bottom fall below the screen. */
  function bringIntoView() {
    var nav = document.getElementById('nav');
    var off = (nav ? nav.getBoundingClientRect().height : 80) + 12;
    var r = root.getBoundingClientRect(), vh = window.innerHeight, dy = 0;
    if (r.top < off) dy = r.top - off;                                   /* card top hidden under the nav */
    else if (r.bottom > vh - 12) dy = Math.min(r.bottom - (vh - 12), r.top - off);   /* card runs off the bottom */
    if (Math.abs(dy) > 2) window.scrollTo({ top: window.scrollY + dy, behavior: reduce ? 'auto' : 'smooth' });
  }

  function show(node, focusSel, scroll) {
    var swap = function () {
      stage.innerHTML = '';
      stage.appendChild(node);
      if (!reduce) { stage.classList.remove('is-out'); stage.classList.add('is-in'); setTimeout(function () { stage.classList.remove('is-in'); }, 450); }
      if (scroll) bringIntoView();
      var f = focusSel && node.querySelector(focusSel);
      if (f) f.focus({ preventScroll: true });
    };
    if (reduce || !stage.firstChild) { swap(); return; }
    stage.classList.add('is-out');
    setTimeout(swap, 220);
  }

  /* --- Intro --- */
  function renderIntro() {
    state.step = -1;
    var globe = el('div', { class: 'gq__globe', 'aria-hidden': 'true' }, [ el('canvas', { class: 'gq__globe-cv' }) ]);
    var node = el('div', { class: 'gq__intro' }, [
      globe,
      el('span', { class: 'gq__eyebrow', text: 'Digital growth assessment' }),
      el('h2', { class: 'gq__title', tabindex: '-1', text: 'Is Your Business Ready for Its Next Digital Leap?' }),
      el('p', { class: 'gq__lead', text: 'Answer a few quick questions to discover the digital solutions that could help your business grow.' }),
      el('div', { class: 'gq__intro-actions' }, [
        el('button', { type: 'button', class: 'gq__btn gq__btn--gold gq__btn--glow', onclick: function () { stopGlobe(); preloadPhotos(); goTo(0, true); } }, [
          el('span', { text: 'Discover My Growth Opportunities' }), el('span', { class: 'gq__btn-ic', html: arrow })
        ]),
        el('p', { class: 'gq__note' }, [ el('span', { text: 'Takes about 2 minutes. Get personalized recommendations for your business.' }) ])
      ]),
      el('ul', { class: 'gq__promise' }, [
        el('li', {}, [ svg('check', 'gq__mini'), el('span', { text: '8 quick questions' }) ]),
        el('li', {}, [ svg('check', 'gq__mini'), el('span', { text: 'Results straight away' }) ]),
        el('li', {}, [ svg('check', 'gq__mini'), el('span', { text: 'Free, no obligation' }) ])
      ])
    ]);
    show(node, null, false);
    startGlobe(globe.querySelector('canvas'));
  }

  /* --- Rotating Earth on the intro card ---
     NASA Blue Marble imagery (public domain, assets/quiz/earth.jpg) mapped onto a lit sphere
     and drawn to a canvas. It turns once every ~40s, pauses when off screen or in a hidden
     tab, and shows a still frame for visitors who prefer reduced motion. */
  var globeRun = null;
  function stopGlobe() { if (globeRun) { globeRun.stop(); globeRun = null; } }
  function startGlobe(cv) {
    stopGlobe();
    if (!cv || !cv.getContext) return;
    var tex = new Image();
    tex.decoding = 'async';
    tex.onload = function () {
      if (!cv.isConnected) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var css = cv.getBoundingClientRect().width || 200;
      var S = Math.round(css * dpr);
      cv.width = S; cv.height = S;
      var ctx = cv.getContext('2d');
      /* texture pixels */
      var tc = document.createElement('canvas'); tc.width = tex.naturalWidth; tc.height = tex.naturalHeight;
      var tx = tc.getContext('2d'); tx.drawImage(tex, 0, 0);
      var TW = tc.width, TH = tc.height, T = tx.getImageData(0, 0, TW, TH).data;
      /* precompute, for every pixel on the disc: texture row, base longitude, lighting */
      var r = S / 2, tilt = -0.36, ct = Math.cos(tilt), st = Math.sin(tilt);
      var L = [-0.55, -0.45, 0.70], ln = Math.hypot(L[0], L[1], L[2]); L = L.map(function (v) { return v / ln; });
      var n = 0, PIX = new Int32Array(S * S), ROW = new Int32Array(S * S), U = new Float32Array(S * S), SH = new Float32Array(S * S), AL = new Uint8Array(S * S);
      for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
        var nx = (x + 0.5 - r) / r, ny = (y + 0.5 - r) / r, d2 = nx * nx + ny * ny;
        if (d2 > 1) continue;
        var nz = Math.sqrt(1 - d2);
        var rx = nx * ct - ny * st, ry = nx * st + ny * ct;             /* axial tilt */
        var lat = Math.asin(-ry), lon = Math.atan2(rx, nz);
        var v = Math.min(TH - 1, Math.max(0, Math.round((0.5 - lat / Math.PI) * (TH - 1))));
        var diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        var shade = 0.62 + 0.88 * Math.pow(diff, 0.8) + 0.14 * Math.pow(diff, 18);    /* ambient + sun + glint (lighter) */
        shade *= 0.8 + 0.2 * Math.pow(nz, 0.4);                             /* gentle limb darkening */
        var edge = Math.min(1, (1 - Math.sqrt(d2)) * r * 1.2);              /* anti-aliased rim */
        PIX[n] = (y * S + x) * 4; ROW[n] = v * TW; U[n] = (lon / (2 * Math.PI) + 0.5) * TW; SH[n] = shade; AL[n] = Math.round(edge * 255); n++;
      }
      var img = ctx.createImageData(S, S), D = img.data;
      var period = 40000, t0 = performance.now(), raf = 0, visible = true, reduce2 = reduce;
      function draw(now) {
        var off = ((now - t0) % period) / period * TW;
        for (var i = 0; i < n; i++) {
          var u = (U[i] + off) | 0; if (u >= TW) u -= TW;
          var ti = (ROW[i] + u) * 4, p = PIX[i], s = SH[i];
          var cr = Math.min(255, T[ti] * s), cg = Math.min(255, T[ti + 1] * s), cb = Math.min(255, T[ti + 2] * s + 6);
          D[p] = cr + (255 - cr) * 0.14; D[p + 1] = cg + (255 - cg) * 0.14; D[p + 2] = cb + (255 - cb) * 0.16; D[p + 3] = AL[i];   /* soft lift to a lighter shade */
        }
        ctx.putImageData(img, 0, 0);
      }
      function loop(now) { draw(now); if (!reduce2 && visible && !document.hidden) raf = requestAnimationFrame(loop); else raf = 0; }
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting; if (visible && !raf && !reduce2) raf = requestAnimationFrame(loop);
      }) : null;
      if (io) io.observe(cv);
      function onVis() { if (!document.hidden && visible && !raf && !reduce2) raf = requestAnimationFrame(loop); }
      document.addEventListener('visibilitychange', onVis);
      raf = requestAnimationFrame(loop);
      cv.parentNode.classList.add('is-ready');
      globeRun = { stop: function () { cancelAnimationFrame(raf); raf = 0; reduce2 = true; if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVis); } };
    };
    tex.src = CONFIG.GLOBE_TEXTURE;
  }

  /* warm the browser cache with every answer photo once the quiz starts (small cropped images) */
  var preloaded = false;
  function preloadPhotos() {
    if (preloaded) return; preloaded = true;
    Object.keys(PHOTOS).forEach(function (k) { var i = new Image(); i.src = CONFIG.PHOTO_CDN + PHOTOS[k] + CONFIG.PHOTO_PARAMS; });
  }

  /* --- Question step --- */
  function renderQuestion(i, scroll) {
    state.step = i;
    var q = QUESTIONS[i], name = 'gq-' + q.id;
    var err = el('p', { class: 'gq__error', id: name + '-err', role: 'alert', hidden: '' });
    var grid = el('div', { class: 'gq__options' + (q.options.length > 6 ? ' gq__options--many' : '') });
    q.options.forEach(function (o) {
      var input = el('input', { type: 'radio', name: name, value: o.id, id: name + '-' + o.id, class: 'gq__radio' });
      if (state.answers[q.id] === o.id) input.checked = true;
      input.addEventListener('change', function () {
        state.answers[q.id] = o.id; err.hidden = true;
        grid.querySelectorAll('.gq__opt').forEach(function (c) { c.classList.toggle('is-on', c.contains(input) ? true : false); });
        next.removeAttribute('aria-disabled');
      });
      /* photo for this answer: assets/quiz/<question>-<answer>.jpg (falls back to the icon if missing) */
      var media = el('span', { class: 'gq__opt-media is-loading', 'aria-hidden': 'true' }, [ svg(o.icon) ]);
      var img = new Image();
      img.alt = ''; img.decoding = 'async';
      img.onload = function () { media.appendChild(img); media.classList.remove('is-loading'); media.classList.add('has-photo'); };
      img.onerror = function () { media.classList.remove('is-loading'); };   /* no photo: keep the icon */
      var pk = q.id + '-' + o.id;
      img.src = PHOTOS[pk] ? CONFIG.PHOTO_CDN + PHOTOS[pk] + CONFIG.PHOTO_PARAMS : CONFIG.PHOTO_DIR + pk + '.jpg';
      grid.appendChild(el('label', { class: 'gq__opt' + (input.checked ? ' is-on' : ''), for: input.id }, [
        input,
        media,
        el('span', { class: 'gq__opt-txt', text: o.label }),
        el('span', { class: 'gq__opt-tick', 'aria-hidden': 'true' }, [ svg('check') ])
      ]));
    });
    var last = i === TOTAL - 1;
    var next = el('button', { type: 'submit', class: 'gq__btn gq__btn--gold' }, [
      el('span', { text: 'Continue' }), el('span', { class: 'gq__btn-ic', html: arrow })
    ]);
    if (!state.answers[q.id]) next.setAttribute('aria-disabled', 'true');

    var form = el('form', { class: 'gq__step', novalidate: '' }, [
      el('div', { class: 'gq__progress' }, [
        progress(i)
      ]),
      el('fieldset', { class: 'gq__fs', 'aria-describedby': name + '-err' }, [
        el('legend', { class: 'gq__q', tabindex: '-1', text: q.q }),
        grid
      ]),
      err,
      el('div', { class: 'gq__nav' }, [
        el('button', { type: 'button', class: 'gq__btn gq__btn--ghost', onclick: function () { i === 0 ? renderIntro() : goTo(i - 1, false); } }, [
          el('span', { class: 'gq__btn-ic gq__btn-ic--back', html: arrow }), el('span', { text: 'Back' })
        ]),
        el('button', { type: 'button', class: 'gq__restart', onclick: restart }, [ el('span', { text: 'Start again' }) ]),
        next
      ])
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!state.answers[q.id]) {
        err.textContent = 'Please choose an option to continue.'; err.hidden = false;
        var first = grid.querySelector('input'); if (first) first.focus();
        return;
      }
      if (last) renderContact(true); else goTo(i + 1, false);
    });
    show(form, '.gq__q', scroll);
    announce('Step ' + (i + 1) + ' of ' + STEPS);
    animateBar(form, i);
  }

  /* "Step n of 9" + progress bar */
  function progress(i) {
    return el('div', { class: 'gq__progress-in' }, [
      el('p', { class: 'gq__count' }, [ el('span', { text: 'Step' }), ' ', el('span', { text: String(i + 1) }), ' ', el('span', { text: 'of' }), ' ', el('span', { text: String(STEPS) }) ]),
      el('div', { class: 'gq__bar', role: 'progressbar', 'aria-label': 'Quiz progress', 'aria-valuemin': '0', 'aria-valuemax': String(STEPS), 'aria-valuenow': String(i + 1) }, [
        el('span', { class: 'gq__bar-fill', style: 'width:' + Math.round((i / STEPS) * 100) + '%' })
      ])
    ]);
  }
  function animateBar(node, i) {
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var f = node.querySelector('.gq__bar-fill'); if (f) f.style.width = Math.round(((i + 1) / STEPS) * 100) + '%';
    }); });
  }
  function goTo(i) { renderQuestion(i, true); }
  function restart() { state.answers = {}; state.sent = null; goTo(0, true); }

  /* --- Step 9: name + mobile (required, with a privacy notice) --- */
  var CODES = ['+971', '+966', '+974', '+973', '+968', '+965', '+91', '+20', '+44', '+1', '+61', '+49', '+33'];
  function renderContact(scroll) {
    state.step = TOTAL;
    var c = state.contact;
    var name = el('input', { id: 'gq-name', class: 'gq__input', type: 'text', autocomplete: 'name', 'aria-required': 'true', 'aria-describedby': 'gq-name-err' });
    name.value = c.name;
    var code = el('select', { id: 'gq-code', class: 'gq__input gq__code', 'aria-label': 'Country code', autocomplete: 'tel-country-code' });
    CODES.forEach(function (v) { var o = el('option', { value: v, text: v }); if (v === c.code) o.selected = true; code.appendChild(o); });
    var phone = el('input', { id: 'gq-phone', class: 'gq__input', type: 'tel', inputmode: 'tel', autocomplete: 'tel-national', 'aria-required': 'true', 'aria-describedby': 'gq-phone-err' });
    phone.value = c.phone;
    var errEl = function (id) { return el('p', { class: 'gq__field-err', id: id + '-err', hidden: '' }); };

    var form = el('form', { class: 'gq__step gq__contact', novalidate: '' }, [
      el('div', { class: 'gq__progress' }, [ progress(TOTAL) ]),
      el('h3', { class: 'gq__q', tabindex: '-1', text: 'Almost there. Where should we send your roadmap?' }),
      el('p', { class: 'gq__lead-intro', text: 'Your results appear on the next screen. We’ll only use these details to follow up on your roadmap.' }),
      el('div', { class: 'gq__fields gq__fields--2' }, [
        el('div', { class: 'gq__field' }, [
          el('label', { class: 'gq__label', for: 'gq-name' }, [ el('span', { text: 'Your name' }), el('span', { class: 'gq__req', 'aria-hidden': 'true', text: ' *' }) ]),
          name, errEl('gq-name')
        ]),
        el('div', { class: 'gq__field' }, [
          el('label', { class: 'gq__label', for: 'gq-phone' }, [ el('span', { text: 'Mobile number' }), el('span', { class: 'gq__req', 'aria-hidden': 'true', text: ' *' }) ]),
          el('div', { class: 'gq__tel' }, [ code, phone ]),
          errEl('gq-phone')
        ])
      ]),
      el('p', { class: 'gq__privacy gq__privacy--step' }, [ el('span', { text: 'By continuing, you agree that IgnizAI may contact you about your roadmap. We never share your details or use them for anything else.' }) ]),
      el('div', { class: 'gq__nav' }, [
        el('button', { type: 'button', class: 'gq__btn gq__btn--ghost', onclick: function () { save(); goTo(TOTAL - 1, false); } }, [
          el('span', { class: 'gq__btn-ic gq__btn-ic--back', html: arrow }), el('span', { text: 'Back' })
        ]),
        el('button', { type: 'button', class: 'gq__restart', onclick: restart }, [ el('span', { text: 'Start again' }) ]),
        el('button', { type: 'submit', class: 'gq__btn gq__btn--gold' }, [ el('span', { text: 'See My Results' }), el('span', { class: 'gq__btn-ic', html: arrow }) ])
      ])
    ]);
    function save() { c.name = name.value.trim(); c.code = code.value; c.phone = phone.value.trim(); }
    function setErr(id, msg) {
      var e = form.querySelector('#' + id + '-err'), inp = form.querySelector('#' + id);
      e.textContent = msg || ''; e.hidden = !msg;
      if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
      return !msg;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); save();
      var digits = c.phone.replace(/\D/g, ''), bad = null;
      if (!setErr('gq-name', c.name.length >= 2 ? '' : 'Please enter your name.')) bad = bad || 'gq-name';
      if (!setErr('gq-phone', digits.length >= 6 && digits.length <= 14 ? '' : 'Please enter a valid mobile number.')) bad = bad || 'gq-phone';
      if (bad) { form.querySelector('#' + bad).focus(); return; }
      sendLead();
      renderResults();
    });
    show(form, '.gq__q', scroll);
    announce('Step ' + STEPS + ' of ' + STEPS);
    animateBar(form, TOTAL);
  }

  /* Send name, mobile, answers and recommendations to the IgnizAI_Leads sheet (once per completed quiz) */
  function sendLead() {
    var recs = recommend(score(state.answers)), c = state.contact;
    var key = JSON.stringify([state.answers, c.name, c.code, c.phone]);
    if (state.sent && state.sent.key === key) return;            /* same answers + details: don't send twice */
    state.sent = { key: key, status: 'pending' };
    if (!CONFIG.LEAD_ENDPOINT) { state.sent.status = 'off'; updateSendNote(); return; }   /* INTEGRATION POINT */
    var parts = c.name.split(/\s+/);
    var payload = {
      submitted_at: new Date().toISOString(),
      first_name: parts[0] || '', last_name: parts.slice(1).join(' '),
      email_id: '', country_code: c.code, contact: c.phone, country: '', city: '', organization_name: '',
      service_names: 'Growth quiz: ' + (recs.length ? recs.map(function (r) { return SERVICES[r.key].name; }).join(', ') : 'General consultation'),
      remark: '— Digital Growth Quiz answers —\n' + QUESTIONS.map(function (q, qi) {
        var o = optionOf(qi, state.answers[q.id]); return q.q + ' — ' + (o ? o.label : '');
      }).join('\n'),
      page: location.href.split('#')[0] + '#growth-quiz',
      /* Quiz_Leads tab (Apps Script routes source=growth_quiz there; the fields above keep
         older script versions working) */
      source: 'growth_quiz',
      name: c.name,
      recommended: recs.length ? roadmap(recs).map(function (st) { return SERVICES[st.key].name; }).join(', ') : 'General consultation'
    };
    QUESTIONS.forEach(function (q, qi) { var o = optionOf(qi, state.answers[q.id]); payload['q_' + q.id] = o ? o.label : ''; });
    var mine = state.sent;
    fetch(CONFIG.LEAD_ENDPOINT, { method: 'POST', body: new URLSearchParams(payload) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok || j.result !== 'success') throw 0; }); })
      .then(function () { mine.status = 'ok'; }, function () { mine.status = 'err'; })
      .then(updateSendNote);
  }
  function updateSendNote() {
    var n = root.querySelector('.gq__sendnote'); if (!n || !state.sent) return;
    var st = state.sent.status;
    n.hidden = st === 'pending';
    n.className = 'gq__sendnote' + (st === 'ok' ? ' is-ok' : ' is-err');
    n.textContent = st === 'ok' ? 'Your roadmap has been shared with the IgnizAI team.'
      : st === 'off' ? "Online sending isn't set up yet. Use Connect with IgnizAI to reach us."
      : "We couldn't save your details just now. Use Connect with IgnizAI to reach us directly.";
  }

  /* --- Results (compact: fits one screen on desktop) --- */
  function renderResults() {
    state.step = STEPS;
    var scores = score(state.answers), recs = recommend(scores);
    var road = roadmap(recs);                         /* cards are shown in roadmap order */
    var first = state.contact.name.split(/\s+/)[0];
    var kids = [];
    var picks = ['website', 'goal'].map(function (qid) {
      var qi = QUESTIONS.map(function (q) { return q.id; }).indexOf(qid), o = optionOf(qi, state.answers[qid]);
      return o && o.s;
    }).filter(Boolean);
    picks.push(recs.length ? "Here's where we'd suggest focusing first."
      : "Your answers don't point to one clear gap, so the best next step is a short conversation about your plans.");

    kids.push(el('div', { class: 'gq__res-head' }, [
      el('div', { class: 'gq__res-titles' }, [
        el('span', { class: 'gq__eyebrow' }, first ? [ el('span', { text: 'Your results' }), el('span', { 'aria-hidden': 'true', text: ' · ' }), el('span', { 'data-no-translate': '', text: first }) ] : [ el('span', { text: 'Your results' }) ]),
        el('h2', { class: 'gq__title gq__title--res', tabindex: '-1', text: 'Your Digital Growth Roadmap' })
      ]),
      el('p', { class: 'gq__disclaimer' }, [ el('span', { text: 'Based only on your answers. This is not a technical audit of your website.' }) ])
    ]));
    kids.push(el('p', { class: 'gq__summary' }, picks.reduce(function (acc, t, k) { if (k) acc.push(' '); acc.push(el('span', { text: t })); return acc; }, [])));

    if (recs.length) {
      var cards = el('ol', { class: 'gq__recs gq__recs--' + road.length, 'aria-label': 'Recommended for you' });
      road.forEach(function (st, k) {
        var r = recs.filter(function (x) { return x.key === st.key; })[0], S = SERVICES[st.key];
        cards.appendChild(el('li', { class: 'gq__rec' + (k === 0 ? ' is-first' : '') }, [
          el('div', { class: 'gq__rec-top' }, [
            el('span', { class: 'gq__rec-num' }, [ el('span', { text: 'Priority' }), ' ', el('span', { text: String(k + 1) }) ]),
            el('span', { class: 'gq__rec-phase', text: PHASES[st.phase].label })
          ]),
          el('h3', { class: 'gq__rec-name', text: S.name }),
          el('p', { class: 'gq__rec-v' }, [ el('strong', { class: 'gq__rec-k', text: 'Why' }), ' ', el('span', { text: reasonsFor(r)[0] }) ]),
          el('p', { class: 'gq__rec-v' }, [ el('strong', { class: 'gq__rec-k', text: 'Benefit' }), ' ', el('span', { text: S.benefit }) ])
        ]));
      });
      kids.push(cards);
    } else {
      kids.push(el('div', { class: 'gq__general' }, [
        el('h3', { class: 'gq__sub', text: 'A general assessment' }),
        el('p', { text: 'Nothing in your answers points to an urgent gap, which is a good sign. The most useful next step is a short consultation, where we can look at your goals together and suggest practical improvements, if any are worth making.' })
      ]));
    }

    kids.push(el('div', { class: 'gq__res-cta' }, [
      el('div', { class: 'gq__res-cta-txt' }, [
        el('p', { class: 'gq__res-cta-title', text: "Let's Turn Your Digital Opportunities into Action." }),
        el('p', { class: 'gq__sendnote', role: 'status', hidden: '' })
      ]),
      el('div', { class: 'gq__res-actions' }, [
        el('button', { type: 'button', class: 'gq__restart', onclick: restart }, [ el('span', { text: 'Restart the quiz' }) ]),
        el('button', { type: 'button', class: 'gq__btn gq__btn--gold gq__btn--glow', onclick: function () { openModal(recs); } }, [
          el('span', { text: 'Connect with IgnizAI' }), el('span', { class: 'gq__btn-ic', html: arrow }) ])
      ])
    ]));

    show(el('div', { class: 'gq__results' }, kids), '.gq__title', true);
    setTimeout(updateSendNote, 260);
    announce('Your Digital Growth Roadmap is ready.');
  }

  /* --- "Connect with IgnizAI": Contact page form in a pop-up, pre-filled --- */
  var QUIZ_TO_CONTACT = { web: 1, presence: 3, cms: 5, hosting: 1, amc: 1, chatbot: 6, automation: 4 };  /* contact.html SERVICES ids */
  var modal = null, lastFocus = null;
  function buildModal() {
    var frame = el('iframe', { class: 'gq-modal__frame', title: 'Enquiry form' });
    var closeBtn = el('button', { type: 'button', class: 'gq-modal__close', 'aria-label': 'Close', 'data-close': '',
      html: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' });
    var m = el('div', { class: 'gq-modal', 'aria-hidden': 'true' }, [
      el('div', { class: 'gq-modal__backdrop', 'data-close': '' }),
      el('div', { class: 'gq-modal__panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'gqModalTitle' }, [
        el('div', { class: 'gq-modal__head' }, [
          el('span', { class: 'gq__eyebrow', text: 'Digital growth assessment' }),
          el('h2', { class: 'gq-modal__title', id: 'gqModalTitle', text: 'Connect with IgnizAI' }),
          el('p', { class: 'gq-modal__sub', text: 'We’ve filled in what you told us. Add anything else and we’ll reply within one business day.' }),
          closeBtn
        ]),
        el('div', { class: 'gq-modal__body' }, [ el('div', { class: 'gq-modal__loading', text: 'Loading form…' }), frame ])
      ])
    ]);
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (!m.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === closeBtn) { e.preventDefault(); frame.focus(); }
        else if (!e.shiftKey && document.activeElement === frame) { e.preventDefault(); closeBtn.focus(); }
      }
    });
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== frame.contentWindow || !e.data || e.data.type !== 'ignizForm') return;
      if (e.data.height) frame.style.height = Math.max(240, e.data.height) + 'px';
      if (e.data.state === 'success') { m.__done = true; m.querySelector('.gq-modal__body').scrollTop = 0; }
    });
    frame.addEventListener('load', function () {
      if (!frame.getAttribute('src')) return;
      m.classList.add('is-ready');
      var p = m.__prefill; if (p) frame.contentWindow.postMessage(p, location.origin);
    });
    return { el: m, frame: frame, close: closeBtn };
  }
  function openModal(recs) {
    if (!modal) modal = buildModal();
    var c = state.contact, parts = c.name.split(/\s+/);
    var svc = [];
    recs.forEach(function (r) { var id = QUIZ_TO_CONTACT[r.key]; if (id && svc.indexOf(id) === -1) svc.push(id); });
    if (!svc.length) svc.push(7);   /* "Not sure lets discuss" */
    modal.el.__prefill = {
      type: 'ignizPrefill', first_name: parts[0] || '', last_name: parts.slice(1).join(' '),
      country_code: c.code, phone: c.phone, services: svc,
      remark: 'From the Digital Growth Quiz. Recommended: ' +
        (recs.length ? roadmap(recs).map(function (st) { return SERVICES[st.key].name; }).join(', ') : 'general consultation') + '.\n'
    };
    lastFocus = document.activeElement;
    if (modal.el.__done || !modal.frame.getAttribute('src')) {
      modal.el.__done = false; modal.el.classList.remove('is-ready');
      modal.frame.style.height = '640px';
      modal.frame.src = 'contact.html?embed=1&src=quiz';
    } else {
      modal.frame.contentWindow.postMessage(modal.el.__prefill, location.origin);   /* already loaded: refresh pre-fill */
    }
    modal.el.classList.add('is-open'); modal.el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('gq-modal-open');
    setTimeout(function () { modal.close.focus(); }, 60);
  }
  function closeModal() {
    if (!modal || !modal.el.classList.contains('is-open')) return;
    modal.el.classList.remove('is-open'); modal.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('gq-modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* -------------------------------------------------------------------- 7. ARABIC */
  var AR = {
    'Step': 'الخطوة', 'Free, no obligation': 'مجاني ودون التزام',
    'Almost there. Where should we send your roadmap?': 'اقتربنا. أين نرسل لك خارطة الطريق؟',
    'Your results appear on the next screen. We’ll only use these details to follow up on your roadmap.': 'تظهر نتائجك في الشاشة التالية. سنستخدم هذه البيانات فقط لمتابعة خارطة طريقك.',
    'Your name': 'اسمك', 'Mobile number': 'رقم الجوال', 'Country code': 'رمز الدولة',
    'I agree that IgnizAI may contact me about my roadmap using these details. They will not be shared or used for anything else.': 'أوافق على أن تتواصل معي IgnizAI بخصوص خارطة طريقي باستخدام هذه البيانات، ولن تُشارك أو تُستخدم لأي غرض آخر.',
    'By continuing, you agree that IgnizAI may contact you about your roadmap. We never share your details or use them for anything else.': 'بالمتابعة، توافق على أن تتواصل معك IgnizAI بخصوص خارطة طريقك. لا نشارك بياناتك ولا نستخدمها لأي غرض آخر.',
    'Please enter your name.': 'يرجى إدخال اسمك.', 'Please enter a valid mobile number.': 'يرجى إدخال رقم جوال صحيح.',
    'Why': 'السبب', 'Benefit': 'الفائدة', 'Connect with IgnizAI': 'تواصل مع IgnizAI', 'Enquiry form': 'نموذج الاستفسار',
    'Your roadmap has been shared with the IgnizAI team.': 'تمت مشاركة خارطة طريقك مع فريق IgnizAI.',
    "Online sending isn't set up yet. Use Connect with IgnizAI to reach us.": 'الإرسال عبر الإنترنت غير مفعّل بعد. استخدم «تواصل مع IgnizAI» للوصول إلينا.',
    "We couldn't save your details just now. Use Connect with IgnizAI to reach us directly.": 'تعذّر حفظ بياناتك الآن. استخدم «تواصل مع IgnizAI» للتواصل معنا مباشرة.',
    'We’ve filled in what you told us. Add anything else and we’ll reply within one business day.': 'ملأنا ما أخبرتنا به. أضف أي تفاصيل أخرى وسنرد خلال يوم عمل واحد.',
    'Loading form…': 'جارٍ تحميل النموذج…', 'Close': 'إغلاق', 'Step 9 of 9': 'الخطوة 9 من 9',
    'Digital growth assessment': 'تقييم النمو الرقمي',
    'Is Your Business Ready for Its Next Digital Leap?': 'هل أعمالك مستعدة لقفزتها الرقمية التالية؟',
    'Answer a few quick questions to discover the digital solutions that could help your business grow.': 'أجب عن بضعة أسئلة سريعة لتكتشف الحلول الرقمية التي قد تساعد أعمالك على النمو.',
    'Discover My Growth Opportunities': 'اكتشف فرص نموّي',
    'Takes about 2 minutes. Get personalized recommendations for your business.': 'يستغرق نحو دقيقتين. احصل على توصيات مخصصة لأعمالك.',
    '8 quick questions': '8 أسئلة سريعة', 'Results straight away': 'نتائج فورية', 'No sign-up needed': 'دون الحاجة إلى تسجيل',
    'Question': 'السؤال', 'of': 'من', 'Quiz progress': 'تقدّم الاختبار',
    'Back': 'رجوع', 'Continue': 'متابعة', 'See My Results': 'اعرض نتائجي', 'Start again': 'ابدأ من جديد',
    'Please choose an option to continue.': 'يرجى اختيار إجابة للمتابعة.',
    /* questions */
    'What best describes your business?': 'ما الذي يصف أعمالك بشكل أفضل؟',
    'Real estate': 'العقارات', 'Healthcare or clinic': 'الرعاية الصحية أو العيادات', 'Professional services or consultancy': 'الخدمات المهنية أو الاستشارات',
    'Retail or e-commerce': 'التجزئة أو التجارة الإلكترونية', 'Hospitality': 'الضيافة', 'Tourism': 'السياحة', 'Education': 'التعليم', 'Other': 'أخرى',
    'Does your business currently have a website?': 'هل لدى أعمالك موقع إلكتروني حالياً؟',
    'No website yet': 'لا يوجد موقع بعد', 'Yes, but it looks outdated': 'نعم، لكنه يبدو قديماً', 'Yes, but it is difficult to update': 'نعم، لكن تحديثه صعب',
    'Yes, but it does not generate enough enquiries': 'نعم، لكنه لا يجلب استفسارات كافية', 'Yes, and it works well': 'نعم، ويعمل بشكل جيد',
    'How do most of your customers discover your business?': 'كيف يكتشف معظم عملائك أعمالك؟',
    'Referrals and word of mouth': 'الإحالات والتوصيات الشفهية', 'Google search': 'البحث في Google', 'Social media': 'وسائل التواصل الاجتماعي',
    'Paid advertising': 'الإعلانات المدفوعة', 'Walk-ins or existing contacts': 'الزيارات المباشرة أو المعارف الحاليون', 'We are not sure': 'لسنا متأكدين',
    'What is your biggest business challenge right now?': 'ما أكبر تحدٍّ يواجه أعمالك حالياً؟',
    'Getting more customer enquiries': 'الحصول على مزيد من استفسارات العملاء', 'Building trust and credibility online': 'بناء الثقة والمصداقية عبر الإنترنت',
    'Updating website content easily': 'تحديث محتوى الموقع بسهولة', 'Managing website performance and maintenance': 'إدارة أداء الموقع وصيانته',
    'Responding to customer questions quickly': 'الرد على أسئلة العملاء بسرعة', 'Reducing repetitive manual work': 'تقليل الأعمال اليدوية المتكررة',
    'How do you currently manage website updates and maintenance?': 'كيف تدير حالياً تحديثات الموقع وصيانته؟',
    'We do not have a website': 'ليس لدينا موقع', 'We depend on a developer for every change': 'نعتمد على مطوّر في كل تعديل',
    'We manage updates ourselves': 'ندير التحديثات بأنفسنا', 'We have a dedicated support provider': 'لدينا مزوّد دعم مخصص',
    'Our website has technical or performance issues': 'يعاني موقعنا من مشكلات تقنية أو في الأداء',
    'How do you handle enquiries outside business hours?': 'كيف تتعامل مع الاستفسارات خارج ساعات العمل؟',
    'We usually respond the next working day': 'نرد عادةً في يوم العمل التالي', 'Customers contact us through WhatsApp': 'يتواصل معنا العملاء عبر واتساب',
    'We use forms or automated responses': 'نستخدم النماذج أو الردود الآلية', 'We have a chatbot or automated support': 'لدينا روبوت محادثة أو دعم آلي',
    'We do not have a consistent process': 'ليس لدينا إجراء ثابت',
    'What would you most like to achieve in the next 3–6 months?': 'ما أكثر ما تودّ تحقيقه خلال الأشهر 3–6 القادمة؟',
    'Launch a professional website': 'إطلاق موقع احترافي', 'Generate more qualified leads': 'توليد مزيد من العملاء المحتملين المؤهلين',
    'Improve online visibility': 'تحسين الظهور عبر الإنترنت', 'Manage website content independently': 'إدارة محتوى الموقع باستقلالية',
    'Improve website reliability and security': 'تحسين موثوقية الموقع وأمانه', 'Automate customer interactions using AI': 'أتمتة التفاعل مع العملاء بالذكاء الاصطناعي',
    'What is your current digital setup?': 'ما وضعك الرقمي الحالي؟',
    'Starting from scratch': 'نبدأ من الصفر', 'Basic website and social media': 'موقع بسيط ووسائل تواصل اجتماعي',
    'Website with regular updates': 'موقع بتحديثات منتظمة', 'Website, CRM, and established digital processes': 'موقع ونظام CRM وإجراءات رقمية راسخة',
    'Not sure what we need': 'لسنا متأكدين مما نحتاجه',
    /* summary sentences */
    'In real estate, buyers and tenants usually research online long before they make contact.': 'في قطاع العقارات، يبحث المشترون والمستأجرون عادةً عبر الإنترنت قبل التواصل بوقت طويل.',
    'For a clinic or healthcare practice, patients look for trust signals and easy ways to book.': 'في العيادات ومراكز الرعاية الصحية، يبحث المرضى عن مؤشرات الثقة وطرق سهلة للحجز.',
    'For a consultancy or professional service, your online presence is often the first proof of expertise.': 'في الاستشارات والخدمات المهنية، يكون حضورك الرقمي غالباً أول دليل على خبرتك.',
    'In retail and e-commerce, customers expect to browse, compare and get answers instantly.': 'في التجزئة والتجارة الإلكترونية، يتوقع العملاء التصفح والمقارنة والحصول على الإجابات فوراً.',
    'In hospitality, guests judge the experience online before they ever arrive.': 'في قطاع الضيافة، يحكم الضيوف على التجربة عبر الإنترنت قبل وصولهم.',
    'In tourism, travellers plan, compare and enquire online, often outside office hours.': 'في السياحة، يخطط المسافرون ويقارنون ويستفسرون عبر الإنترنت، غالباً خارج ساعات العمل.',
    'In education, families compare options online and expect timely, clear information.': 'في التعليم، تقارن العائلات الخيارات عبر الإنترنت وتتوقع معلومات واضحة في وقتها.',
    "Every business is different, so we've focused on the challenges and goals you described.": 'كل نشاط تجاري مختلف، لذا ركّزنا على التحديات والأهداف التي وصفتها.',
    "You don't have a website yet, which means people searching for you have nowhere to land.": 'ليس لديك موقع بعد، ما يعني أن من يبحث عنك لا يجد وجهة يصل إليها.',
    'You already have a website, but it may no longer reflect the quality of your business.': 'لديك موقع بالفعل، لكنه قد لا يعكس جودة أعمالك بعد الآن.',
    'You have a website, but keeping it up to date is harder than it should be.': 'لديك موقع، لكن إبقاءه محدّثاً أصعب مما ينبغي.',
    "You have a website, but it isn't bringing in enough enquiries yet.": 'لديك موقع، لكنه لا يجلب استفسارات كافية بعد.',
    'Your website already works well, so the focus is on what comes next.': 'موقعك يعمل جيداً بالفعل، لذا ينصبّ التركيز على الخطوة التالية.',
    'Your biggest challenge is attracting more customer enquiries.': 'أكبر تحدٍّ لديك هو جذب مزيد من استفسارات العملاء.',
    'Building trust and credibility online is a priority for you.': 'بناء الثقة والمصداقية عبر الإنترنت أولوية بالنسبة لك.',
    'Updating content easily is holding you back.': 'صعوبة تحديث المحتوى تعيقك.',
    'Keeping your website fast, stable and maintained is a concern.': 'الحفاظ على موقعك سريعاً ومستقراً ومُصاناً مصدر قلق لك.',
    'Responding to customer questions quickly is a pressure point.': 'الرد السريع على أسئلة العملاء نقطة ضغط لديك.',
    'Repetitive manual work is taking up time your team could spend elsewhere.': 'الأعمال اليدوية المتكررة تستهلك وقتاً يمكن لفريقك قضاؤه في أمور أخرى.',
    'In the next few months, you want to launch a professional website.': 'خلال الأشهر القليلة القادمة، تريد إطلاق موقع احترافي.',
    'In the next few months, you want to generate more qualified leads.': 'خلال الأشهر القليلة القادمة، تريد توليد مزيد من العملاء المحتملين المؤهلين.',
    'In the next few months, you want to be easier to find online.': 'خلال الأشهر القليلة القادمة، تريد أن يسهل العثور عليك عبر الإنترنت.',
    'In the next few months, you want to manage your content independently.': 'خلال الأشهر القليلة القادمة، تريد إدارة محتواك باستقلالية.',
    'In the next few months, you want a more reliable and secure website.': 'خلال الأشهر القليلة القادمة، تريد موقعاً أكثر موثوقية وأماناً.',
    'In the next few months, you want to automate customer interactions with AI.': 'خلال الأشهر القليلة القادمة، تريد أتمتة التفاعل مع العملاء بالذكاء الاصطناعي.',
    "You're not sure what you need yet, which is exactly what a short consultation can clarify.": 'لست متأكداً بعد مما تحتاجه، وهذا بالضبط ما يمكن لاستشارة قصيرة توضيحه.',
    "Here's where we'd suggest focusing first.": 'إليك ما نقترح التركيز عليه أولاً.',
    "Your answers don't point to one clear gap, so the best next step is a short conversation about your plans.": 'لا تشير إجاباتك إلى فجوة واضحة واحدة، لذا فأفضل خطوة تالية هي محادثة قصيرة حول خططك.',
    /* results */
    'Your results': 'نتائجك', 'Your Digital Growth Roadmap': 'خارطة طريق نموّك الرقمي',
    'Based only on your answers. This is not a technical audit of your website.': 'مبنية على إجاباتك فقط، وليست تدقيقاً تقنياً لموقعك.',
    'Recommended for you': 'موصى به لك', 'Why it may be relevant': 'لماذا قد يكون مناسباً', 'Expected benefit': 'الفائدة المتوقعة',
    'How IgnizAI can help': 'كيف يمكن لـ IgnizAI المساعدة', 'Explore This Service': 'استكشف هذه الخدمة',
    'Suggested roadmap': 'خارطة الطريق المقترحة', 'Priority': 'الأولوية',
    'Foundation': 'الأساس', 'Customer growth': 'نمو العملاء', 'Efficiency': 'الكفاءة', 'Ongoing support': 'الدعم المستمر',
    'Get the foundations right first.': 'ابدأ بإرساء الأساس الصحيح.', 'Attract and convert more customers.': 'اجذب مزيداً من العملاء وحوّلهم.',
    'Save time with smarter processes.': 'وفّر الوقت بإجراءات أذكى.', 'Keep everything running smoothly.': 'حافظ على سير كل شيء بسلاسة.',
    'A general assessment': 'تقييم عام',
    'Nothing in your answers points to an urgent gap, which is a good sign. The most useful next step is a short consultation, where we can look at your goals together and suggest practical improvements, if any are worth making.': 'لا شيء في إجاباتك يشير إلى فجوة ملحّة، وهذه علامة جيدة. أنفع خطوة تالية هي استشارة قصيرة نراجع فيها أهدافك معاً ونقترح تحسينات عملية إن كان هناك ما يستحق.',
    'See everything we offer': 'اطّلع على كل ما نقدمه',
    "Let's Turn Your Digital Opportunities into Action.": 'لنحوّل فرصك الرقمية إلى خطوات عملية.',
    "Share your requirements with IgnizAI and let's explore a practical solution for your business.": 'شارك متطلباتك مع IgnizAI ولنستكشف معاً حلاً عملياً لأعمالك.',
    'Discuss My Requirements': 'ناقش متطلباتي', 'Explore Our Services': 'استكشف خدماتنا',
    'Change my answers': 'تعديل إجاباتي', 'Restart the quiz': 'إعادة الاختبار',
    /* services */
    'Website Development & Redesign': 'تطوير المواقع وإعادة تصميمها',
    'Lead-Generating Website & Digital Presence': 'موقع يجلب العملاء وحضور رقمي',
    'Content Management System (CMS)': 'نظام إدارة المحتوى (CMS)',
    'Hosting & Website Reliability': 'الاستضافة وموثوقية الموقع',
    'Annual Maintenance Contract (AMC)': 'عقد الصيانة السنوية (AMC)',
    'AI Chatbot & Customer Support': 'روبوت محادثة ذكي ودعم العملاء',
    'Business Automation & AI Integration': 'أتمتة الأعمال وتكامل الذكاء الاصطناعي',
    'A credible, modern website that presents your business clearly and turns visits into enquiries.': 'موقع حديث وموثوق يعرض أعمالك بوضوح ويحوّل الزيارات إلى استفسارات.',
    'We design and build fast, mobile-friendly websites from scratch, structured around what you want visitors to do next.': 'نصمّم ونبني مواقع سريعة ومتوافقة مع الجوال من الصفر، مبنية حول ما تريد أن يفعله الزائر بعد ذلك.',
    'More people find you, trust what they see, and get in touch.': 'يجدك عدد أكبر من الناس، ويثقون بما يرونه، ويتواصلون معك.',
    'We set up search-friendly pages, clear calls to action, enquiry forms and the essentials that help you show up and convert.': 'نُعدّ صفحات متوافقة مع محركات البحث، ودعوات واضحة لاتخاذ إجراء، ونماذج استفسار، وكل الأساسيات التي تساعدك على الظهور والتحويل.',
    'Update pages, services and blog posts yourself, without waiting on a developer.': 'حدّث الصفحات والخدمات ومقالات المدونة بنفسك، دون انتظار مطوّر.',
    'We build an easy editing system with guardrails, so your team can make changes safely and keep the design intact.': 'نبني نظام تحرير سهلاً بضوابط، ليتمكن فريقك من إجراء التعديلات بأمان مع الحفاظ على التصميم.',
    'A fast, secure website that stays online, with backups in place.': 'موقع سريع وآمن يبقى متاحاً، مع نسخ احتياطية جاهزة.',
    'We set up dependable hosting, domain, SSL and backups, and tune your site for speed and stability.': 'نُعدّ استضافة موثوقة ونطاقاً وشهادة SSL ونسخاً احتياطية، ونضبط موقعك للسرعة والاستقرار.',
    'A reliable partner who keeps your website updated, secure and running smoothly.': 'شريك موثوق يحافظ على موقعك محدّثاً وآمناً ويعمل بسلاسة.',
    'We handle updates, monitoring, fixes and small content changes on an agreed annual plan.': 'نتولى التحديثات والمراقبة والإصلاحات وتعديلات المحتوى البسيطة ضمن خطة سنوية متفق عليها.',
    'Instant answers for customers at any hour, and fewer repetitive questions for your team.': 'إجابات فورية للعملاء في أي وقت، وأسئلة متكررة أقل لفريقك.',
    'We build a chatbot trained on your services and FAQs that captures enquiries and hands warm leads to your team.': 'نبني روبوت محادثة مدرَّباً على خدماتك وأسئلتك الشائعة، يلتقط الاستفسارات ويسلّم العملاء الجادّين لفريقك.',
    'Less time on repetitive tasks and smoother day-to-day workflows.': 'وقت أقل في المهام المتكررة وسير عمل يومي أكثر سلاسة.',
    'We connect your website, forms, CRM and tools so routine steps like follow-ups, routing and updates happen automatically.': 'نربط موقعك ونماذجك ونظام CRM وأدواتك لتتم الخطوات الروتينية مثل المتابعة والتوجيه والتحديثات تلقائياً.',
    /* reasons */
    "You don't have a website yet, so customers who look you up have nowhere to land.": 'ليس لديك موقع بعد، لذا لا يجد العملاء الذين يبحثون عنك وجهة يصلون إليها.',
    "Without a website, it's harder to appear in search results or look established next to competitors.": 'من دون موقع، يصعب الظهور في نتائج البحث أو الظهور بمظهر راسخ أمام المنافسين.',
    'Your current website may look dated, which can quietly cost you trust.': 'قد يبدو موقعك الحالي قديماً، ما قد يكلّفك جزءاً من الثقة دون أن تلاحظ.',
    'You want to build trust, and a polished website is often the first proof people look for.': 'تريد بناء الثقة، والموقع المتقن غالباً أول دليل يبحث عنه الناس.',
    'Launching a professional website is one of your goals for the next few months.': 'إطلاق موقع احترافي من أهدافك للأشهر القليلة القادمة.',
    'Your website gets visitors but not enough enquiries, so its structure may need rethinking.': 'يستقبل موقعك زواراً لكن دون استفسارات كافية، لذا قد يحتاج هيكله إلى إعادة نظر.',
    'You told us that more enquiries are a priority.': 'أخبرتنا أن زيادة الاستفسارات أولوية.',
    'You want to be easier to find online.': 'تريد أن يسهل العثور عليك عبر الإنترنت.',
    'Most customers find you through referrals, and a strong online presence helps them check you out and get in touch.': 'يصل إليك معظم العملاء عبر الإحالات، والحضور الرقمي القوي يساعدهم على التعرّف عليك والتواصل معك.',
    'Customers find you on Google, so how you appear in search matters.': 'يجدك العملاء عبر Google، لذا فطريقة ظهورك في البحث مهمة.',
    'Customers find you on Google, where a fast, reliable website helps you rank and convert.': 'يجدك العملاء عبر Google، حيث يساعدك الموقع السريع والموثوق على التصدّر والتحويل.',
    'Customers find you on social media, and a strong website turns that attention into enquiries.': 'يجدك العملاء عبر وسائل التواصل الاجتماعي، والموقع القوي يحوّل هذا الاهتمام إلى استفسارات.',
    'You use paid advertising, which works best when it lands on pages built to convert.': 'تستخدم الإعلانات المدفوعة، وهي تحقق أفضل النتائج عندما تقود إلى صفحات مصممة للتحويل.',
    "Customers mostly find you offline, so there's room to reach people who search online.": 'يجدك معظم العملاء خارج الإنترنت، لذا هناك مجال للوصول إلى من يبحثون عبر الإنترنت.',
    "You're not sure how customers find you, and a clearer online presence makes that measurable.": 'لست متأكداً من كيفية وصول العملاء إليك، والحضور الرقمي الأوضح يجعل ذلك قابلاً للقياس.',
    'Updating your website is difficult right now.': 'تحديث موقعك صعب حالياً.',
    'You depend on a developer for every change.': 'تعتمد على مطوّر في كل تعديل.',
    'You want to manage your content independently.': 'تريد إدارة محتواك باستقلالية.',
    'A new website needs dependable hosting, a domain and security from day one.': 'يحتاج الموقع الجديد إلى استضافة موثوقة ونطاق وحماية منذ اليوم الأول.',
    'A new website stays secure and up to date with an ongoing care plan.': 'يبقى الموقع الجديد آمناً ومحدّثاً مع خطة رعاية مستمرة.',
    'You mentioned technical or performance issues.': 'ذكرت وجود مشكلات تقنية أو في الأداء.',
    'Website reliability and security are a priority for you.': 'موثوقية الموقع وأمانه أولوية بالنسبة لك.',
    'You need dependable, ongoing care for your website.': 'تحتاج إلى رعاية موثوقة ومستمرة لموقعك.',
    'Your website works well, and ongoing care helps keep it that way.': 'موقعك يعمل جيداً، والرعاية المستمرة تساعد على إبقائه كذلك.',
    'You manage updates yourself, and having support on call helps when something technical comes up.': 'تدير التحديثات بنفسك، ووجود دعم عند الطلب يساعد عند ظهور أي مشكلة تقنية.',
    'You update your website regularly, so ongoing support keeps it healthy.': 'تحدّث موقعك بانتظام، لذا يحافظ الدعم المستمر على سلامته.',
    'Enquiries outside business hours usually wait until the next working day.': 'الاستفسارات خارج ساعات العمل تنتظر عادةً حتى يوم العمل التالي.',
    'Customers message you on WhatsApp, and an assistant can answer common questions instantly.': 'يراسلك العملاء عبر واتساب، ويمكن لمساعد ذكي الإجابة عن الأسئلة الشائعة فوراً.',
    'You already use forms or automated replies, and a chatbot can take this further.': 'تستخدم بالفعل النماذج أو الردود الآلية، ويمكن لروبوت المحادثة أن يطوّر ذلك.',
    "There isn't a consistent process for handling enquiries yet.": 'لا يوجد بعد إجراء ثابت للتعامل مع الاستفسارات.',
    'Responding quickly to customer questions is a challenge.': 'الرد السريع على أسئلة العملاء يمثّل تحدياً.',
    'You want to use AI to automate customer interactions.': 'تريد استخدام الذكاء الاصطناعي لأتمتة التفاعل مع العملاء.',
    "Repetitive manual work is taking up your team's time.": 'الأعمال اليدوية المتكررة تستهلك وقت فريقك.',
    'You already have a CRM and established processes, and automation can connect them.': 'لديك بالفعل نظام CRM وإجراءات راسخة، ويمكن للأتمتة ربطها معاً.',
    'You already use automated support, so connecting it with your other tools is a natural next step.': 'تستخدم بالفعل دعماً آلياً، لذا فربطه بأدواتك الأخرى خطوة تالية طبيعية.',
    "You have a basic website and social media, and there's room to make them work harder.": 'لديك موقع بسيط ووسائل تواصل اجتماعي، وهناك مجال لجعلها تعمل بفعالية أكبر.',
    'In your industry, customers compare options online before getting in touch.': 'في قطاعك، يقارن العملاء الخيارات عبر الإنترنت قبل التواصل.',
    'Businesses like yours often receive many similar questions from potential customers.': 'تتلقى الأعمال المماثلة لأعمالك غالباً أسئلة متشابهة كثيرة من العملاء المحتملين.',
    'Businesses like yours handle many orders and requests that are easy to automate.': 'تتعامل الأعمال المماثلة لأعمالك مع طلبات كثيرة يسهل أتمتتها.',
    'Schools and training providers update information often, such as dates, courses and notices.': 'تحدّث المدارس ومراكز التدريب معلوماتها باستمرار، مثل المواعيد والدورات والإعلانات.',
    /* lead form */
    'Share your details (optional)': 'شارك بياناتك (اختياري)',
    "Send your results to IgnizAI and we'll reply within one business day. Nothing is sent unless you submit this form.": 'أرسل نتائجك إلى IgnizAI وسنرد خلال يوم عمل واحد. لا يُرسل أي شيء ما لم ترسل هذا النموذج.',
    'Business name': 'اسم النشاط التجاري', 'Work email': 'البريد الإلكتروني للعمل', 'WhatsApp number': 'رقم واتساب',
    'Anything else we should know?': 'هل هناك ما تودّ إخبارنا به؟', '(Optional)': '(اختياري)',
    'I agree that IgnizAI may use these details to respond to my enquiry. They will not be shared or used for anything else.': 'أوافق على أن تستخدم IgnizAI هذه البيانات للرد على استفساري، ولن تُشارك أو تُستخدم لأي غرض آخر.',
    'Privacy: your quiz answers stay in your browser unless you choose to send them with this form.': 'الخصوصية: تبقى إجاباتك في متصفحك ما لم تختر إرسالها مع هذا النموذج.',
    'Send to IgnizAI': 'أرسل إلى IgnizAI', 'Sending…': 'جارٍ الإرسال…', 'Sent': 'تم الإرسال', 'Sending your details…': 'جارٍ إرسال بياناتك…',
    'Please enter your business name.': 'يرجى إدخال اسم نشاطك التجاري.', 'Please enter a valid work email.': 'يرجى إدخال بريد عمل صحيح.',
    'Please enter a valid WhatsApp number, including the country code.': 'يرجى إدخال رقم واتساب صحيح مع رمز الدولة.',
    'Please tick the consent box to continue.': 'يرجى تحديد خانة الموافقة للمتابعة.',
    "Thank you. We've received your details and will reply within one business day.": 'شكراً لك. استلمنا بياناتك وسنرد خلال يوم عمل واحد.',
    'Something went wrong and your details were not sent. Please try again, or email us at tech@ignizai.com.': 'حدث خطأ ولم تُرسل بياناتك. يرجى المحاولة مرة أخرى أو مراسلتنا على tech@ignizai.com.',
    "Online submission isn't set up yet. Please email us at tech@ignizai.com or use the Contact page.": 'الإرسال عبر الإنترنت غير مفعّل بعد. يرجى مراسلتنا على tech@ignizai.com أو استخدام صفحة التواصل.',
    'Your Digital Growth Roadmap is ready.': 'خارطة طريق نموّك الرقمي جاهزة.'
  };
  if (window.IgnizAII18n && window.IgnizAII18n.extend) window.IgnizAII18n.extend(AR);

  renderIntro();
})();

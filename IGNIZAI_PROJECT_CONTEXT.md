# IgnizAI Website — Project Context

Read this first. It explains what the ignizai.com website is, how it is built, the design rules, and how changes are made and published.

## 1. The business

- **IgnizAI** (also written Igniz AI, Ignizai, Igniz) is a technology studio in **Ras Al Khaimah, UAE**.
- It helps UAE small and growing businesses with five connected services:
  1. Website building
  2. Digital presence (Google Business Profile, local SEO, social)
  3. AI automation (chatbots, bilingual EN/AR bot, booking, CRM)
  4. Lead generation (CTAs, smart forms, lead magnets)
  5. Revenue growth & care (maintenance, SEO, reporting)
- **Own product:** BanksView (banksview.com), a FinTech SaaS that turns bank statement PDFs into a 141-metric Excel report, risk score and dashboard, for lenders in India.
- **Contact:** tech@ignizai.com · WhatsApp / phone +971 50 789 4113
- **Packages (AED):**

  | Package | Price |
  | --- | --- |
  | Ignite Basic | 6,250 |
  | Ignite Business (Bestseller) | 18,050 |
  | Ignite Premium | 45,250 |
  | Ignite Intelligence (AI add-on) | 22,100 |

  Footnote, always shown with prices: "All prices in AED. Domain and hosting may be billed at the provider's current market rate."

## 2. Tech and publishing

- Static site: plain HTML, CSS and JavaScript. No framework, no CMS, no build step.
- Repo: GitHub `ignizai` (local path `~/Documents/GitHub/ignizai`).
- **Preview locally:**
  ```
  cd ~/Documents/GitHub/ignizai && python3 -m http.server 8090
  ```
  Then open http://localhost:8090 and press Cmd+Shift+R (hard refresh).
- **Publish:**
  ```
  cd ~/Documents/GitHub/ignizai && git add -A && git commit -m "message" && git push
  ```
  Always include the `cd` part.
- Cache-busting: CSS/JS links carry `?v=YYYYMMDD` (+ letter). Bump it whenever a file changes.
- Fonts are self-hosted in `assets/fonts/` (Fraunces display, Inter body, IBM Plex Sans Arabic, Noto Naskh Arabic).

## 3. Pages

| Page | File | Key sections |
| --- | --- | --- |
| Home | index.html | Growth-engine hero (5 rotating stages + animated dashboard, pause button); industry photo marquee (10 sectors, infinite loop); "What we do" 5-card grid (right 4 cards pop up in sequence, replays on reverse scroll); full-bleed Selected work carousel (BanksView first); scroll-driven process dial (reversible); packages teaser; growth quiz; FAQ; journal; CTA |
| Services | services.html | Dark masthead + "growth stack" panel; sticky service navigator with scroll-spy; 5 service cards; 4 package cards with enquiry pop-up; "Under the hood" 6 principles; CTA box |
| Work | work.html | Fanned screenshots hero; industry filter; 5 case studies |
| Process | process.html | Animated gears + workflow hero; scroll-driven 5-stage journey (assets/journey.js); "What you can expect"; CTA |
| About | about.html | At-a-glance panel; story; mission & vision; 6 principles; proof strip; founder section (built but hidden — keep hidden unless asked) |
| Journal | blog.html + 3 blog-*.html | Drifting-books hero; category filter; article cards |
| Contact | contact.html | Enquiry form |

## 4. Key files

| File | Role |
| --- | --- |
| assets/theme.css | Shared tokens, nav, footer, unified type scale, footer watermark |
| assets/i18n.js | Arabic dictionary + `IgnizAII18n.extend({...})` API to add English→Arabic strings |
| assets/editorial.js | Preloader (adds `.is-lit` to `#hero`), reveals, typewriter, Selected work carousel |
| assets/hero.css / hero.js | Home hero (growth engine) |
| assets/home.css / home.js | Home sections + Arabic strings for them |
| assets/process-dial.css / .js | Home "How we work" dial |
| assets/services-page.css / .js | Services page |
| assets/pages.css / pages.js | Work, About, Process, Journal pages + filters |
| assets/inner-hero.css | Dark masthead shared by inner pages (distinct from home hero) |
| assets/journal-hero.css / .js | Journal floating books |
| assets/process-hero.css | Process gears animation |
| assets/showcase/*.jpg | Project screenshots (banksview.jpg is 2400 px) |

## 5. Design rules

- **Colours:** ivory `#F7F3EC` canvas, forest `#17362A` / `#0B1F17`, gold `#B08528` / `#C99A3A` / `#E4C063`, mint `#6FD3A6` only as a growth accent.
- **Home hero:** light ivory with a dark green panel. **Inner pages:** dark forest masthead with rounded bottom corners, outlined page-name watermark and ivory infographic panels. Keep them visually different.
- **Type scale (desktop):** page title 37 px, section h2 34 px, card h3 19 px, lead 15 px. Same size for each level on every page.
- **Footer:** ivory, matching the nav bar, with a faint tech-icon watermark.
- **Compact spacing:** sections about 95 px vertical padding on desktop.
- **Motion:** every animation must respect `prefers-reduced-motion` and work when scrolling up as well as down. No hover animations on the Selected work carousel.
- **Bilingual:** every new visible string gets an Arabic entry via `IgnizAII18n.extend`. RTL layout must mirror.
- **Sticky elements:** need `html, body { overflow-x: clip }` (not `hidden`) on that page.

## 6. Content rules

- Use only real facts: no invented numbers, testimonials or client results. Illustrative figures carry an "Example" tag.
- Don't promise "reply within one business day" (removed on purpose).
- Don't mention "UAE and India" in hero copy; say UAE.

## 7. How to work with the owner

- Show every change on localhost first, then give the publish command.
- Act as product designer when asked: propose, build, then show screenshots.
- Keep replies short; give the preview and push commands at the end.

## 8. Open items (see PRD)

Not indexed by Google yet; no analytics; no testimonials; no Google Business Profile; Arabic incomplete for long descriptions; industry photos still load from Unsplash; footer still lists the old 4 services.

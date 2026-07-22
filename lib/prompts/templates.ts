/**
 * AI Website Powerhouse — 31 prompt templates
 *
 * Originally lifted verbatim from the legacy `components/AIWebsitePowerhouse.js`
 * monolith as part of the W1 PR-1 extraction (short bullet-list prompts).
 *
 * 2026-07-21 full rewrite (user-directed): every template body was upgraded
 * to match the detail level of the restaurant_menu "Copper Thistle" example
 * the user hand-wrote and approved as the quality bar — named businesses and
 * characters, an explicit page-by-page (or view-by-view, for app-style
 * templates) structural breakdown, explicit instructions AGAINST the default
 * centered-heading-plus-3-card-grid layout with named alternative
 * compositions (asymmetric splits, bleed images, horizontally-scrollable
 * strips, masonry, diagonal dividers, oversized pull-quotes), a specific
 * named color palette and typography pairing, and an explicit reminder that
 * every image element must use a real, container-sized placehold.co URL —
 * never an empty colored box. Object keys are UNCHANGED from the original
 * file (see "Consumers" below — they look up by exact key string), so
 * anything that already references a template by key keeps working.
 *
 * Going forward: do NOT tweak wording without an accompanying regeneration
 * test, because the model's output structure (and therefore the multi-file
 * parser's success rate) is sensitive to phrasing. New templates should
 * match this same level of detail, not the old short-bullet style.
 *
 * Categories represented:
 *   Business · Marketing · E-commerce · Professional services ·
 *   Creative · SaaS · Education · Lifestyle · Entertainment ·
 *   Real Estate · Tech · Media · Community · Family & Education ·
 *   Local Business · Health & Wellness
 *
 * Consumers (current as of W1 PR-1):
 *   - `handleSelectTemplate(templateKey)` in the legacy Builder — looks
 *     up by key string.
 *   - `saveUserTemplate` / user-template UI — iterates entries to render
 *     the template picker.
 */

/** Shape of a single template entry. */
export interface PromptTemplate {
  /** Display label shown in the template picker. */
  name: string;
  /** Display category used to group templates in the picker. */
  category: string;
  /** Multi-line prompt body sent to the LLM. */
  prompt: string;
}

/**
 * Keyed catalog of the 31 production prompt templates. Indexed as
 * `Record<string, PromptTemplate>` rather than a stricter union type
 * because the legacy caller passes a string from a `<select>` value
 * (`handleSelectTemplate(templateKey: string)`).
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // Business & Marketing
  saas_landing: {
    name: '🚀 SaaS Landing Page',
    category: 'Business',
    prompt: `Create a complete, polished multi-page website for a B2B SaaS product called Wavelength — an AI-powered focus and workload analytics tool for engineering teams. Confident, technical, premium — appeals to CTOs and eng managers, never generic startup fluff. Build separate pages with a persistent nav (Home, Product, Pricing, Customers, Docs, Contact) plus a fixed "Start Free Trial" button in the header.
Avoid the default centered-headline-plus-3-card-grid on every section — vary composition page to page: an asymmetric hero with the headline set left and a live product screenshot bleeding off the right edge; a horizontally-scrollable integration-logo strip instead of a static row; a bento-style feature grid with mismatched cell sizes (one large, several small) instead of uniform cards; an oversized italic-serif pull-quote from a customer breaking out of the column grid; a diagonal-angled section divider at least once.
Home page: full-bleed hero with a dark gradient-mesh background, oversized headline positioned off-center, a live dashboard screenshot mockup tilted in perspective, dual CTAs (Start Free Trial, Watch 2-Min Demo) as pill buttons with hover fill animation; a "How Wavelength Sees Your Team" three-step section using connected diagonal arrows, not boxed steps; a bento feature grid (6 features, mismatched sizes); customer-logo marquee that scrolls continuously; a single large auto-advancing testimonial on a dark full-bleed band; a metrics strip with large animated counters (40% fewer context switches, 12,000+ engineers, 4.9 rating).
Product page: a tabbed interface styled as underlined text (not boxed pills) switching between Focus Time, Meeting Load, and Burnout Signals, each tab revealing its own screenshot and a two-column benefit list with small icon glyphs.
Pricing page: three tiers (Team, Growth, Enterprise) in cards of differing heights (Growth taller, "Most Popular" ribbon), annual/monthly toggle, a comparison table below with checkmarks, and an FAQ accordion.
Customers page: a case-study grid mixing tall and wide cards (not uniform), each with a company logo, one metric, and a link; a large pull-quote breaking the grid on one featured case.
Docs page: a two-column layout — sidebar of doc categories on the left, content preview cards on the right.
Contact/Sales page: split-screen layout, inquiry form on one side, an office/team photo bleeding to the page edge with a glass-panel overlay listing a response-time promise.
Deep navy and near-black base with an electric cyan accent, clean geometric sans-serif throughout (no serif), generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  agency_portfolio: {
    name: '💼 Creative Agency Portfolio',
    category: 'Business',
    prompt: `Create a complete, polished multi-page website for a creative branding and motion-design agency called Nightshift Studio. Bold, cinematic, a little irreverent — this is a portfolio, not a corporate brochure. Build separate pages with a persistent nav (Work, Studio, Services, Journal, Contact) and a minimal always-visible "Start a Project" link.
Avoid centered-heading-plus-3-card-grid sections everywhere — vary the composition: a full-bleed hero image or reel poster with the studio name huge and off-grid, cropped by the viewport edge; a horizontally-scrollable case-study strip on the home page instead of a static grid; project thumbnails at mismatched aspect ratios in a masonry layout, not uniform squares; a diagonal-cut section transition between two bands of contrasting color at least once; a giant italic pull-quote from a client testimonial breaking across the column grid.
Home page: full-bleed hero with a large moody image, agency name set oversized and off-center, a one-line manifesto beneath a thin accent rule, scroll-cue arrow; horizontally-scrollable selected-work strip (6 projects) with drag-to-scroll feel and hover-reveal project name/client; a "How We Work" three-stage section laid out as an angled timeline, not boxed steps; client-logo strip; a full-bleed dark testimonial band with one large auto-advancing quote.
Work page: masonry project grid mixing portrait and landscape thumbnails with a hover zoom and category filter (Branding, Motion, Web, Campaign) styled as underlined text tabs.
Studio page: editorial layout — large team photo on one side bleeding to the edge, a pull-quote from the founder in italic serif breaking the grid, bio copy in a narrower column beside it, with a secondary masonry strip of studio/culture photos below at varied heights.
Services page: an asymmetric two-column layout per service (image left/text right, alternating sides down the page) covering Brand Identity, Motion & Animation, Web Design, Campaign Strategy, each with a short process note and representative project link.
Journal page: article grid with mismatched card sizes (one featured large card, rest smaller), category tags, read time.
Contact page: split-screen — inquiry form (name, company, budget range, project type, message) on one side, a large studio-space photo bleeding past the section boundary on the other with office hours in a glass-panel card.
Near-black base with warm off-white and a single bold coral accent, oversized condensed display type paired with a clean workhorse sans body font, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  ecommerce_fashion: {
    name: '👗 Fashion E-commerce Store',
    category: 'E-commerce',
    prompt: `Create a complete, polished multi-page website for a contemporary fashion label called Marlow and Ash. Minimal, editorial, quietly luxurious — never loud or cluttered. Build separate pages with a persistent nav (Shop, New Arrivals, Collections, Journal, About, Contact) and a sticky header with a cart icon and item count.
Avoid centered-heading-plus-3-card-grid — vary the composition: a full-bleed lookbook hero image with the collection name set small and off to one side, not centered; an asymmetric two-column product spotlight (oversized image left, sparse text right) on the homepage instead of a grid; a horizontally-scrollable New Arrivals strip with drag-to-scroll feel; product photography that bleeds to the page edge at least once; an oversized italic-serif quote from the designer breaking out of the grid on the About page.
Home page: full-bleed seasonal campaign image with a dark-to-transparent gradient, collection name and season set off-center in large serif type, thin gold rule, shop-the-look CTA; horizontally-scrollable New Arrivals strip (8 pieces) with hover showing a second angle; an editorial split section pairing one large campaign image with a short brand statement; a three-piece "Shop the Edit" asymmetric layout (one large item, two stacked smaller); customer-review strip with star ratings.
Shop page: sticky filter sidebar (category, size, color, price) beside a product grid with hover-swap imagery, quick-view modal (image gallery, size selector, color swatches, add to bag).
Collections page: full-bleed collection banners stacked with alternating text alignment (left, then right, then left) and a short designer note per collection.
Journal page: editorial article grid mixing a large featured story with smaller secondary cards, styling and behind-the-scenes content.
About page: magazine-style layout — designer portrait large on one side, an oversized pull-quote in italic serif breaking the column grid, brand story in a narrower single column beside it, with a masonry strip of atelier/process photos below at varied heights.
Contact page: compact form beside a store-location photo with hours in a glass-panel overlay; email signup as a closing full-bleed band with an oversized headline and inline email field plus button.
Bone white and charcoal base with a single muted gold accent, elegant serif display headings paired with a clean sans body, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  restaurant_menu: {
    name: '🍽️ Restaurant Website',
    category: 'Business',
    prompt: `Create a complete, polished multi-page website for an upscale farm-to-table restaurant called The Copper Thistle. Build it as separate pages with a persistent nav (Home, Menu, About, Gallery, Reservations, Contact) — not a single long-scrolling page. Sophisticated, intimate, food-obsessed. Every image element must use a real placehold.co image URL sized to its container — never an empty colored box.
Avoid generic centered-heading-plus-3-card-grid layouts on every section. Vary the composition page to page: asymmetric two-column splits, images that bleed to the page edge, text overlapping image corners, a diagonal or angled section divider at least once, oversized pull-quotes in italic serif breaking out of the grid.
Home page: full-bleed hero image with a dark gradient overlay, an oversized serif headline positioned off-center (not dead-center), a thin gold rule under the tagline, and a reserve-a-table button that's pill-shaped with a hover fill animation; a horizontally-scrollable signature-dishes strip (not a static 3-column grid) with a drag-to-scroll feel; a full-bleed testimonial section with one large quote at a time on a dark background, auto-advancing with subtle crossfade; a private-events banner using a split-screen image/text layout with the image extending past the section boundary.
Menu page: tabs styled as an underlined text nav (not boxed buttons), each tab revealing a two-column list of 6-8 dishes with a thin divider rule between items, prices right-aligned in a distinct accent color, small dietary-icon glyphs inline after each dish name.
About page: an editorial magazine-style layout — chef photo large on one side, a big pull-quote from Chef Elena Marchetti in italic serif breaking the column grid, body bio text in a narrower single column beside it, with a secondary strip of 3-4 process/kitchen photos below in a masonry-style (varied height) layout rather than uniform squares.
Gallery page: a masonry grid mixing portrait and landscape image sizes (not uniform squares), with a hover zoom effect, plus a labeled Instagram strip of 6 square photos with a subtle rounded-corner hover lift.
Reservations page: a two-column layout — reservation form (date, time slots as pill buttons, party-size stepper) on one side, a large ambiance photo with the private-events pitch overlaid in a glass-panel card on the other; private-events inquiry form (event date, guest count, occasion) below as a separate card, not stacked directly under the main form with no separation.
Contact page: address/hours/parking in a compact left column, an embedded-map placeholder filling the right two-thirds, testimonials carousel below as a full-width dark band with 4-5 quotes and star ratings, newsletter signup as a closing full-bleed section with an oversized headline and a single-line email input plus button inline.
Deep burgundy and charcoal palette with warm gold accents on a cream base, elegant serif display headings paired with clean sans-serif body text, generous whitespace, real hover/scroll micro-interactions throughout, fully responsive, real content.`
  },

  // Professional Services
  law_firm: {
    name: '⚖️ Law Firm Website',
    category: 'Professional',
    prompt: `Create a complete, polished multi-page website for a mid-size multi-practice law firm called Sterling and Voss. Authoritative, precise, quietly powerful — this reads like an established firm with real depth, not a solo practitioner. Build separate pages with a persistent nav (Home, Practice Areas, Attorneys, Results, Insights, Contact) and a fixed free-consultation button in the header.
Avoid centered-heading-plus-3-card-grid on every section — vary composition: an asymmetric hero splitting a skyline or courthouse image against a dark text panel, not centered; a horizontally-scrollable practice-area strip instead of a static grid; a full-bleed case-results band with oversized statistic numbers breaking out of their columns; an italic-serif pull-quote from a named partner breaking the grid on the Attorneys page; a thin diagonal divider between two contrasting bands at least once.
Home page: full-bleed hero image with a dark overlay, firm name and a precise value statement set off-center, thin gold rule, dual CTAs (Schedule a Consultation, Call Now); a horizontally-scrollable Practice Areas strip (Corporate, Real Estate, Family Law, Litigation, Estate Planning) each opening to a short description; a Results band with three oversized statistics (cases won, years combined experience, client retention) laid out asymmetrically, not in equal boxes; a full-bleed dark testimonial section with one large auto-advancing client quote; a named-partner spotlight with a large portrait and pull-quote.
Practice Areas page: alternating asymmetric two-column sections (image one side, detail the other, flipping down the page) for each practice area with a short "how we help" paragraph and related-results link.
Attorneys page: a directory grid mixing one large featured partner card with smaller associate cards, each attorney with headshot, credentials, bar admissions, and a short bio; a large pull-quote from the managing partner breaking the grid at the top.
Results page: a case-results table styled with generous row spacing and a distinct accent color for outcome figures, plus two or three narrative case studies in an editorial two-column layout.
Insights page: article grid with a featured large card and smaller secondary cards covering legal updates.
Contact page: compact office-details column (address, hours, parking) beside a large office-interior photo bleeding to the page edge, consultation-request form (matter type, brief description, preferred contact method) as a separate card below with required disclaimers in the footer.
Deep navy and parchment palette with a warm brass accent, serif display headings paired with a clean sans body, generous whitespace, restrained real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  medical_clinic: {
    name: '🏥 Medical Clinic Website',
    category: 'Professional',
    prompt: `Create a complete, polished multi-page website for a modern multi-provider medical clinic called Willowbrook Family Health. Clean, calming, trustworthy — never sterile or cold. Build separate pages with a persistent nav (Home, Services, Providers, Patient Portal, Insurance, Contact) and a fixed "Book an Appointment" button in the header.
Avoid centered-heading-plus-3-card-grid everywhere — vary composition: an asymmetric hero pairing a warm clinic-interior photo with an off-center headline, not dead-center; a horizontally-scrollable services strip instead of a flat grid; an oversized pull-quote from a patient testimonial breaking the grid; a split-screen banner for the patient-portal promotion with the image bleeding past the section edge; a soft angled divider between two bands at least once.
Home page: full-bleed hero with a warm, light-filled clinic photo and a soft gradient overlay, headline positioned off-center with a calm subhead, dual CTAs (Book an Appointment, Find a Provider); a horizontally-scrollable Services strip (General Practice, Pediatrics, Women's Health, Preventive Care, Behavioral Health) each with an icon glyph and short description; a split-screen Patient Portal promotion with the app-mockup image extending past the section boundary; a full-bleed testimonial band with one large auto-advancing patient quote; an insurance-logos strip.
Services page: alternating asymmetric two-column sections per service line (photo one side, detail the other, alternating sides down the page) with what-to-expect notes.
Providers page: a directory mixing one larger featured provider card with smaller cards for the rest, each with photo, specialization, education, languages spoken; a pull-quote from the medical director breaking the grid at the top.
Patient Portal page: a two-column layout showing portal screenshots on one side and a feature list (messaging, records, scheduling, billing) on the other, with a login mockup card.
Insurance page: a clean list of accepted providers grouped by plan type, plus a short FAQ accordion on billing and referrals.
Contact page: compact hours/location/parking column beside a large embedded-map placeholder filling the remaining width, with an emergency-contact notice styled distinctly, and an appointment-request form as a separate card below.
Soft clinical blue and sage green on a warm white base, accessible clean sans-serif throughout with a light serif for the clinic name treatment only, generous whitespace, gentle real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Creative & Media
  photography_portfolio: {
    name: '📸 Photography Portfolio',
    category: 'Creative',
    prompt: `Create a complete, polished multi-page website for a fine-art wedding and portrait photographer named Wren Isley. Minimal, moody, image-first — the photography must always be the loudest thing on the page. Build separate pages with a persistent, understated nav (Portfolio, Weddings, Portraits, About, Pricing, Contact) that fades to transparent over the hero image.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with the photographer's name set small and off-corner, never centered; a masonry portfolio grid mixing portrait and landscape crops, not uniform squares; an image bleeding to the page edge with text overlapping its corner at least once; an oversized italic-serif pull-quote from a couple's testimonial breaking out of the grid; a diagonal crop or angled divider between two full-bleed images at least once.
Home page: full-bleed hero image with the name and a one-line tagline set small in a bottom corner, subtle scroll-cue; a masonry highlights grid (10-12 images, mixed portrait/landscape) with hover zoom; a two-column split pairing one large image with a short artist statement, text overlapping the image's corner; a full-bleed testimonial band with one large auto-advancing couple quote.
Portfolio page: filterable masonry grid (Weddings, Portraits, Editorial, Film) with lightbox on click.
Weddings and Portraits pages: each a full-bleed opening image, a short approach paragraph in a narrow column, then a masonry gallery of that category with mixed aspect ratios and hover zoom.
About page: editorial layout — large portrait of the photographer on one side, an oversized pull-quote in italic serif breaking the column grid, bio and approach text in a narrower column beside it, with a masonry strip of behind-the-scenes photos below at varied heights.
Pricing page: two or three collection cards of differing heights (Elopement, Full Day, Portrait Session) with what's-included lists, plus an inquiry-first note rather than an instant checkout.
Contact page: a spare inquiry form (names, event date, location, package interest, message) beside one large atmospheric image bleeding to the page edge.
Near-black and warm ivory palette with a single muted terracotta accent, elegant thin serif display type paired with a minimal sans body, generous whitespace, restrained real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  video_production: {
    name: '🎬 Video Production Studio',
    category: 'Creative',
    prompt: `Create a complete, polished multi-page website for a video production studio called Halogen Films. Bold, cinematic, high-energy — this should feel like a reel, not a brochure. Build separate pages with a persistent nav (Work, Services, Studio, Process, Contact) and a fixed "Start a Project" CTA.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed auto-playing (muted) showreel hero with the studio name huge and off-grid; a horizontally-scrollable project strip with drag-to-scroll feel instead of a static grid; project thumbnails at mismatched aspect ratios in a masonry layout; a diagonal-cut divider between two contrasting color bands at least once; an oversized italic pull-quote from a client breaking the grid.
Home page: full-bleed showreel hero with play/pause control and the studio name set off-center; a horizontally-scrollable Selected Work strip (8 projects) with hover-reveal client/project type; a Services band styled as an angled diagonal list (Corporate Video, Commercials, Music Videos, Event Coverage, Animation) rather than boxed cards; client-logo marquee; a full-bleed dark testimonial band with one large auto-advancing quote alongside a small embedded-video-style thumbnail.
Work page: masonry project grid mixing portrait (vertical/social) and landscape thumbnails with hover-play preview and category filter styled as underlined text tabs.
Services page: alternating asymmetric two-column sections per service (thumbnail one side, detail the other, alternating sides) with example project links.
Studio page: editorial layout — large team/behind-the-scenes photo on one side, a pull-quote from the creative director in italic serif breaking the grid, studio story in a narrower column beside it, with a masonry strip of equipment/BTS photos below at varied heights.
Process page: a horizontal angled timeline (Discovery, Script, Shoot, Edit, Delivery) rather than boxed steps, with a short note per stage.
Contact page: split-screen — project-brief form (project type, budget range, timeline, message) on one side, a large studio/set photo bleeding past the section boundary on the other.
Near-black base with warm off-white and a single vivid amber accent, bold condensed display type paired with a clean sans body, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Tech & SaaS
  project_management: {
    name: '📊 Project Management Dashboard',
    category: 'SaaS',
    prompt: `Create a complete, polished multi-view product UI for a project-management tool called Fieldstone. Confident, calm, information-dense but never cluttered — this is a real working app, not a marketing mockup. Build separate views with a persistent left sidebar nav (Dashboard, Projects, Tasks, Team, Reports, Settings) and a top bar (search, notifications, profile menu).
Avoid centered-heading-plus-3-card-grid on every screen — vary composition: an asymmetric dashboard layout mixing one large primary chart with several small stat tiles of different sizes, not a uniform grid; a horizontally-scrollable project-cards strip on the Projects view instead of a static grid; a full-width Kanban board with visibly different column widths per status; an oversized callout number breaking out of its card at least once (e.g. completion rate).
Dashboard view: top row of four stat tiles at deliberately mismatched sizes (Active Projects small, Tasks Due Today small, Team Members small, Completion Rate larger with an oversized percentage breaking its card boundary); a large primary timeline/progress chart spanning two-thirds width beside a narrower activity feed; a horizontally-scrollable strip of recent-project cards with progress bars; an upcoming-deadlines list styled as a compact agenda, not a card grid.
Projects view: horizontally-scrollable project strip at top (drag-to-scroll feel) followed by a detailed list/table view with status pills, owner avatars, and progress bars.
Tasks view: a Kanban board (To Do, In Progress, Review, Done) with drag-and-drop cards, column headers showing live counts, and a quick-add row at the bottom of each column.
Team view: a directory grid mixing one larger featured lead card with smaller member cards, each with avatar, role, current workload indicator, and active-task count.
Reports view: an asymmetric layout — one large timeline chart, a smaller task-distribution donut chart beside it, and a full-width team-workload bar chart below.
Settings view: a two-column layout with a left settings-category list and a right detail panel.
Deep slate and off-white base with a single confident indigo accent for primary actions and status pills, clean geometric sans-serif throughout, generous whitespace despite the data density, real hover/scroll micro-interactions, every image/avatar element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  analytics_dashboard: {
    name: '📈 Analytics Dashboard',
    category: 'SaaS',
    prompt: `Create a complete, polished multi-view product UI for a web analytics platform called Meridian. Precise, data-forward, premium fintech-adjacent feel. Build separate views with a persistent left sidebar nav (Overview, Traffic, Audience, Conversions, Reports, Settings) and a top bar with a date-range picker and comparison toggle (current vs previous period).
Avoid centered-heading-plus-3-card-grid on every screen — vary composition: an asymmetric Overview layout mixing one large primary line chart with several small mismatched-size metric tiles; a full-width geographic map with data points bleeding to the panel edge; an oversized headline metric (e.g. total revenue) breaking out of its tile boundary; a horizontally-scrollable top-pages strip instead of a plain table on smaller panels.
Overview view: top row of four metric tiles at mismatched sizes (Users and Sessions small, Revenue larger with an oversized number breaking its card boundary, Conversion Rate small with a trend arrow); a large primary line chart (daily/weekly/monthly toggle) spanning two-thirds width beside a narrower real-time activity feed; a traffic-sources donut chart paired asymmetrically with a top-channels list.
Traffic view: a full-width geographic map with data points, a horizontally-scrollable strip of top-performing-pages cards below it, and a traffic-sources breakdown (Organic, Paid, Social, Direct) as an angled bar rather than a plain pie.
Audience view: a demographics breakdown (age, gender, device) laid out as mismatched-size panels, not equal thirds, plus a returning-vs-new visitors comparison chart.
Conversions view: a conversion-funnel visualization with progressively narrowing bands and drop-off percentages called out beside each stage, plus a goal-completion table.
Reports view: a report-builder layout — configuration panel on one side, live chart preview on the other, with an export/schedule action row.
Settings view: two-column layout, category list left, detail panel right.
Near-black and cool graphite base with a single electric teal accent for charts and primary actions, clean geometric sans-serif, generous whitespace despite data density, real hover/scroll micro-interactions on charts and tiles, every image/avatar element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Education & Learning
  online_course: {
    name: '🎓 Online Course Platform',
    category: 'Education',
    prompt: `Create a complete, polished multi-page website for an online course called The Deep End — Product Design From First Principles, taught by instructor Nadia Okonkwo. Confident, outcome-focused, premium creator-education feel. Build separate pages with a persistent nav (Home, Curriculum, Instructor, Reviews, Pricing, FAQ) and a fixed "Enroll Now" button.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric hero pairing an oversized headline with a tilted course-preview video card bleeding off the edge; a horizontally-scrollable module strip instead of a flat accordion-only layout; an oversized outcome statistic breaking out of its card; a pull-quote from a star student breaking the grid on the Reviews page; a diagonal divider between two contrasting bands at least once.
Home page: full-bleed hero with a dark gradient background, oversized off-center headline, instructor name and credibility line beneath a thin accent rule, dual CTAs (Enroll Now, Watch Free Preview); a horizontally-scrollable "What You'll Build" strip of project thumbnails; an outcomes band with three oversized statistics (students enrolled, average rating, completion rate) laid out asymmetrically; a full-bleed dark testimonial section with one large auto-advancing student quote and a small avatar.
Curriculum page: an accordion of modules, each expanding to a two-column lesson list with duration and a small lock/preview icon, plus a horizontally-scrollable strip of sample-lesson thumbnails at the top.
Instructor page: editorial layout — large instructor photo on one side, an oversized pull-quote in italic serif breaking the grid, bio and credentials in a narrower column beside it, with a masonry strip of past-work/teaching photos below at varied heights.
Reviews page: a mixed-size testimonial wall (one large featured review, smaller ones around it) with ratings and named students.
Pricing page: two or three tiers (Self-Paced, Cohort, Team) at differing card heights with a comparison table below and an FAQ accordion.
Deep plum and warm cream base with a single confident amber accent, bold serif display headings paired with a clean sans body, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  university_website: {
    name: '🏛️ University Website',
    category: 'Education',
    prompt: `Create a complete, polished multi-page website for a mid-size university called Ashcombe University. Academic, credible, alive with campus energy — never sterile bureaucracy. Build separate pages with a persistent nav (Home, Academics, Admissions, Campus Life, Research, Contact) and a fixed "Apply Now" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed campus hero image with the university name set off-center, not dead-center; a horizontally-scrollable programs strip instead of a flat grid; an oversized statistic breaking out of its column on the Research page; a diagonal divider between two contrasting bands at least once; an editorial pull-quote from a student or faculty member breaking the grid.
Home page: full-bleed hero image (campus at golden hour) with a dark gradient overlay, headline set off-center, quick-links row (Apply Now, Visit Campus, Programs, Admissions); a horizontally-scrollable Schools and Programs strip; a News and Events split section (news list one side, upcoming-events calendar the other); a full-bleed testimonial band with one large auto-advancing student quote; an oversized-statistics band (acceptance rate, average class size, alumni employed within six months) laid out asymmetrically.
Academics page: programs grouped by school in an alternating asymmetric two-column layout (image one side, program list the other, alternating sides down the page), each with a filterable category tag.
Admissions page: a step-by-step timeline (Apply, Submit Documents, Interview, Decision) as an angled path rather than boxed steps, tuition and financial-aid figures in a clear table, and an application-inquiry form.
Campus Life page: masonry photo gallery of student life mixing portrait and landscape crops, plus student testimonials and a clubs/activities strip.
Research page: research highlights with oversized statistics breaking out of their cards, faculty spotlight cards, and a publications list.
Contact page: compact office/hours column beside a large campus-map placeholder, with an inquiry form as a separate card.
Deep crimson and stone-gray palette on a warm white base, traditional serif display headings paired with a clean sans body, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Entertainment & Lifestyle
  fitness_gym: {
    name: '💪 Fitness Studio Website',
    category: 'Lifestyle',
    prompt: `Create a complete, polished multi-page website for a boutique fitness studio called Ironwood Athletic Club. High-energy, disciplined, premium-gritty — never generic stock-photo fitness. Build separate pages with a persistent nav (Home, Classes, Trainers, Membership, Community, Contact) and a fixed "Start Free Trial" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with the studio name set huge and off-grid, cropped by the viewport edge; a horizontally-scrollable class-schedule strip instead of a flat grid; an oversized before/after statistic breaking out of its card on the Community page; a diagonal-cut divider between two contrasting bands at least once; an italic pull-quote from a member testimonial breaking the grid.
Home page: full-bleed hero action photo with a dark gradient overlay, oversized off-center headline, motivational tagline beneath a thin accent rule, dual CTAs (Start Free Trial, Book a Class) as pill buttons with hover fill animation; a horizontally-scrollable Today's Classes strip with times, instructors, and difficulty tags; a split-screen Trainers teaser (image one side, text the other, image bleeding past the section edge); a full-bleed dark testimonial band with one large auto-advancing transformation story.
Classes page: a schedule grid grouped by day styled as an angled/staggered layout rather than a flat table, with difficulty-level color coding.
Trainers page: a directory mixing one larger featured trainer card with smaller cards, each with specializations, certifications, and a book-session button; a pull-quote from the head coach breaking the grid.
Membership page: three tiers (Drop-In, Unlimited, All-Access) at differing card heights with a benefits comparison table and a limited-time-offer banner.
Community page: a masonry gallery of member transformation photos and event photos mixed with varied heights, plus a testimonials wall with before/after stats breaking out of their cards.
Contact page: compact hours/location column beside a large facility photo bleeding to the page edge, class-inquiry form as a separate card.
Near-black base with a bold safety-orange accent and warm off-white text panels, bold condensed display type paired with a clean sans body, generous whitespace despite the intensity, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  music_band: {
    name: '🎸 Music Band Website',
    category: 'Entertainment',
    prompt: `Create a complete, polished multi-page website for a touring rock band called Wolf Hour. Loud, atmospheric, tour-ready — this should feel like album artwork, not a corporate site. Build separate pages with a persistent nav (Home, Music, Tour, Band, Merch, Contact) and a fixed "Get Tickets" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image or album-cover treatment with the band name huge and off-grid; a horizontally-scrollable discography strip instead of a flat grid; an oversized tour-date entry breaking its row on sold-out shows; a diagonal-cut divider between two contrasting bands at least once; a full-bleed press-quote band with oversized italic type.
Home page: full-bleed hero with the latest album artwork and a dark gradient overlay, band name set off-center in oversized type, listen-now CTA linking to a visual player interface with track list; a horizontally-scrollable Discography strip (album covers, release years); a Tour Dates preview list with sold-out states styled distinctly; a full-bleed dark press-quote band with 2-3 oversized italic quotes; a merch teaser split-screen (product photo one side, shop-now the other, image bleeding past the section edge).
Music page: the visual player interface expanded with a full track list per album, plus embedded-style video thumbnails for music videos.
Tour page: a full tour-dates table (date, city, venue, tickets button) with sold-out rows visually distinct, grouped by leg/region.
Band page: editorial layout — large band photo on one side, an oversized pull-quote from the lead in italic serif breaking the grid, band bio in a narrower column beside it, with a masonry strip of live/studio photos below at varied heights, and individual member cards with instruments below.
Merch page: a product grid with hover-swap imagery and a limited-drop banner.
Contact page: a booking-inquiry form (event type, date, venue capacity, message) beside a large live-show photo bleeding to the page edge, plus a press-kit download link and social links.
Near-black base with a single vivid magenta accent and heavy texture/grain treatment, oversized bold display type paired with a utilitarian sans body, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Real Estate & Property
  real_estate_luxury: {
    name: '🏡 Luxury Real Estate',
    category: 'Real Estate',
    prompt: `Create a complete, polished multi-page website for a high-end real estate brokerage called The Hartwell Collection. Understated luxury, editorial, image-first — never salesy. Build separate pages with a persistent nav (Home, Listings, Neighborhoods, Agent, Sold, Contact) and a fixed search icon in the header.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed property hero image with the agency name set small and off-corner; a horizontally-scrollable featured-listings strip instead of a flat grid; a listing photo bleeding to the page edge with price overlapping its corner at least once; an oversized italic pull-quote from a client testimonial breaking the grid; a diagonal divider between two contrasting bands at least once.
Home page: full-bleed hero image of a signature property with a dark gradient overlay, a minimal search bar (location, price range, bedrooms) positioned off-center rather than dead-center; a horizontally-scrollable Featured Listings strip with hover details (price, beds, baths, sqft) fading in; a Neighborhoods teaser as an asymmetric two-column split (map/image one side, list the other); a full-bleed testimonial band with one large auto-advancing client quote; a Recently Sold strip.
Listings page: a filterable grid (location, price range, property type, features) with hover-swap imagery, opening to a property-detail page with a large image gallery, a virtual-tour button, amenities list, and a mortgage-calculator card.
Neighborhoods page: full-bleed neighborhood banners stacked with alternating text alignment (left, then right), each with schools, shopping, and dining ratings.
Agent page: editorial layout — large agent portrait on one side, an oversized pull-quote in italic serif breaking the grid, bio and market philosophy in a narrower column beside it, with client-listing highlights below.
Sold page: a masonry grid of recently sold properties with sale price and days-on-market, mixed portrait/landscape image sizes.
Contact page: a schedule-a-viewing form beside a large office or signature-property photo bleeding to the page edge, with an email-signup band closing the page.
Warm stone and charcoal palette with a muted gold accent on a soft ivory base, elegant serif display headings paired with a clean sans body, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Technology & Startup
  crypto_exchange: {
    name: '₿ Crypto Trading Platform',
    category: 'Tech',
    prompt: `Create a complete, polished multi-view product UI for a cryptocurrency trading platform called Ledgerline. Precise, high-trust, fintech-serious — never gimmicky or meme-coin flashy. Build separate views with a persistent sidebar/top nav (Dashboard, Trade, Portfolio, Markets, Security, Settings) and a top bar showing portfolio value and 24h change.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric dashboard mixing one large trading chart with several small mismatched-size stat tiles; a full-width live-price ticker bleeding to the panel edge; an oversized portfolio-value figure breaking out of its card; a horizontally-scrollable trending-coins strip instead of a flat table on the Markets view.
Dashboard view: top band with an oversized portfolio value and 24h change breaking its card boundary, beside smaller tiles (asset count, 24h volume, watchlist alerts); a live-price ticker strip scrolling continuously; a large trading chart (candlesticks, volume, indicator toggle) spanning two-thirds width beside a narrower order book; a portfolio asset-allocation donut chart paired asymmetrically with a holdings list.
Trade view: a full trading layout — chart and order book dominant, a compact Buy/Sell panel docked to one side with amount, price, and total calculation, and a recent-trades feed below.
Portfolio view: an asset-allocation view mixing a large donut chart with a detailed holdings table, transaction-history list below with filter controls.
Markets view: a horizontally-scrollable trending-coins strip (gainers, losers) followed by a full market table with mini sparkline charts per row.
Security view: a features showcase (2FA, cold storage, insurance) as mismatched-size panels, not equal thirds, plus a device/session management list.
Settings view: two-column layout, category list left, detail panel right, including deposit/withdraw and price-alert setup.
Near-black base with a single confident green accent for gains and a muted red for losses, clean geometric sans-serif throughout, dense but breathable spacing, real hover/scroll micro-interactions on charts, every image/icon element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  ai_saas_tool: {
    name: '🤖 AI SaaS Tool',
    category: 'Tech',
    prompt: `Create a complete, polished multi-page website for an AI-powered content-generation SaaS called Fernway. Confident, modern, capability-forward — never breathless hype. Build separate pages with a persistent nav (Home, Product, Use Cases, Pricing, Docs, Contact) and a fixed "Try Fernway Free" button.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric hero pairing an oversized headline with a live interactive demo panel bleeding off the right edge; a horizontally-scrollable use-case strip instead of a flat grid; a bento-style feature grid with mismatched cell sizes; an oversized result statistic breaking out of its card; a diagonal divider between two contrasting bands at least once.
Home page: full-bleed hero with a dark gradient-mesh background, oversized off-center headline, a live-feeling demo/playground panel (input field, generate button, sample output) tilted in perspective; a horizontally-scrollable Use Cases strip (blog posts, ad copy, product descriptions, emails); a bento feature grid (6 features, mismatched sizes) covering tone control, brand voice, team workspaces, API access, integrations, and version history; a results band with oversized statistics (time saved, words generated, accuracy improved) laid out asymmetrically; a full-bleed dark testimonial band with one large auto-advancing customer quote; integration-logo marquee.
Product page: a tabbed interface styled as underlined text switching between Write, Edit, and Brand Voice, each tab showing its own screenshot and a two-column benefit list.
Use Cases page: a template gallery grid mixing large featured templates with smaller ones, filterable by category.
Pricing page: three usage-based tiers (Starter, Pro, Team) at differing card heights, a comparison table below, and an FAQ accordion covering usage limits and data privacy.
Docs page: a two-column layout — sidebar of doc categories left, quick-start content preview right, with an API-reference teaser card.
Contact page: split-screen sales-inquiry form on one side, a team/office photo bleeding past the section boundary on the other with security and compliance badges below.
Deep charcoal and warm off-white base with a single vivid violet accent, clean geometric sans-serif throughout with subtle gradient accents, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Blog & Content
  magazine_blog: {
    name: '📰 Digital Magazine',
    category: 'Media',
    prompt: `Create a complete, polished multi-page website for a digital magazine called The Long Reach, covering technology, culture, and ideas. Editorial, confident, built for long-form reading. Build separate pages with a persistent nav (Home, Technology, Culture, Opinion, Newsletter, Search) and a slim top utility bar (date, subscribe link).
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed featured-story hero with the headline set off-center over the image, not dead-center; a masonry article grid mixing one large featured card with smaller secondary cards, not uniform tiles; an oversized italic pull-quote breaking out of the article body column; a diagonal or angled section divider between two bands at least once; an author byline strip styled as a horizontally-scrollable row of contributor cards.
Home page: full-bleed featured-story hero image with a dark gradient overlay, headline and excerpt positioned off-center, category tag and read time; a masonry Latest Stories grid (one large card, several smaller, mixed image sizes); a horizontally-scrollable Trending strip; a Newsletter promo band styled as a split-screen (illustration one side, signup the other); a Contributors strip (horizontally-scrollable author cards with photo and specialty).
Section pages (Technology, Culture, Opinion): a category hero band followed by a masonry article grid filtered to that section, with a sidebar of trending/related tags.
Article page template note: a full-bleed featured image, headline set large and off-center, byline and read time, body copy in a single readable column with at least one oversized italic pull-quote breaking the column width, related-articles strip at the end, and a comments section.
Newsletter page: a full-bleed closing section with an oversized headline, a short value proposition, and a single-line email input with an inline subscribe button.
Search results: a clean list view with thumbnail, category tag, and excerpt per result.
Warm ivory base with deep ink-black text and a single editorial crimson accent, confident serif headlines paired with a highly readable sans body, generous whitespace and line-height tuned for reading, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Community & Social
  nonprofit_charity: {
    name: '❤️ Nonprofit Organization',
    category: 'Community',
    prompt: `Create a complete, polished multi-page website for a nonprofit called Bridgeline Youth Alliance, focused on mentorship and after-school programs for underserved teens. Hopeful, human, credibility-driven — never guilt-heavy or generic stock-photo charity. Build separate pages with a persistent nav (Home, Our Work, Get Involved, Impact, Stories, Contact) and a fixed "Donate" button in the header.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with the headline positioned off-center over a warm gradient overlay; a horizontally-scrollable programs strip instead of a flat grid; an oversized impact statistic breaking out of its card with an animated counter; a diagonal divider between two contrasting bands at least once; an editorial pull-quote from a mentee or mentor breaking the grid on the Stories page.
Home page: full-bleed hero image of a real program moment with a warm gradient overlay, mission statement set off-center, dual CTAs (Donate, Become a Mentor); a horizontally-scrollable Our Programs strip (Academic Mentoring, Career Prep, Summer Intensive, Family Support); an impact band with oversized animated statistics (youth served, mentor hours, program completion rate) laid out asymmetrically; a full-bleed testimonial band with one large auto-advancing story from a program graduate.
Our Work page: alternating asymmetric two-column sections per program (photo one side, description the other, alternating sides down the page) with concrete outcomes per program.
Get Involved page: a split layout of ways to help (Donate, Mentor, Volunteer, Corporate Partner) each with its own card of differing size based on commitment level, plus a volunteer-signup form.
Impact page: a transparency section with a financials-summary chart, board and staff listing, and partner-organization logos.
Stories page: a masonry layout of mentee/mentor story cards mixing large featured stories with smaller ones, each with a portrait and a respectful, specific narrative excerpt.
Contact page: compact office/hours column beside a large program-photo bleeding to the page edge, newsletter signup as a closing full-bleed band with an oversized headline and inline email field.
Warm terracotta and deep teal palette on a soft cream base, confident rounded sans-serif headings with a clean readable body font, accessible high-contrast text, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  wedding_planning: {
    name: '💒 Wedding Planning',
    category: 'Lifestyle',
    prompt: `Create a complete, polished multi-page wedding website for a couple, Maren and Theo, getting married next fall. Romantic, personal, effortlessly elegant — never cluttered or overly saccharine. Build separate pages with a persistent nav (Home, Our Story, Details, Travel, Registry, RSVP) and a subtle countdown in the header.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed engagement-photo hero with the couple's names set off-center over a soft gradient overlay; a horizontally-scrollable engagement-gallery strip instead of a flat grid; an image bleeding to the page edge with the countdown or a detail overlapping its corner at least once; an oversized italic-serif line from their story breaking the grid; a soft angled divider between two bands at least once.
Home page: full-bleed hero image of the couple with a soft gradient overlay, names set in oversized elegant serif off-center, wedding date and a thin gold rule beneath, countdown timer, RSVP CTA; a horizontally-scrollable engagement-photo strip; a brief "Our Story" teaser as a split-screen (photo one side, short story the other, image bleeding past the section edge) linking to the full story page.
Our Story page: an editorial timeline of the relationship (how they met, the proposal, engagement) laid out as alternating asymmetric sections with photos and short narrative text, including one oversized italic pull-quote from their story.
Details page: a schedule of events (welcome dinner, ceremony, reception, farewell brunch) as a vertical timeline with times and locations, wedding-party section with photos and short bios, and a dress-code note.
Travel page: accommodation recommendations in cards of varying size (recommended hotel larger, alternates smaller), local recommendations for out-of-town guests, and transportation notes.
Registry page: registry links presented as elegant cards linking to multiple stores, with a short note on gifts vs. presence.
RSVP page: an RSVP form (name, attending yes/no, meal selection, plus-one, song request, message) alongside a guestbook/messages section showing a few sample well-wishes.
Soft blush and sage palette on a warm ivory base with a single muted gold accent, elegant serif display type paired with a delicate sans body, generous whitespace, gentle real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // ── Expanded library (2026-07-11, upgraded 2026-07-21) — richer,
  // detailed prompts modeled on the same quality bar as restaurant_menu's
  // "Copper Thistle" example above.

  // Family & Education
  kidsDaycare: {
    name: "Daycare / Childcare Center",
    category: "Family & Education",
    prompt: `Create a complete, polished multi-page website for a small family-run daycare called Little Sprouts. Warm, nurturing, professional — appeals to parents, never childish or cartoonish. Build separate pages with a persistent nav (Home, Programs, A Day Here, Our Staff, Enrollment, Contact) and a fixed "Schedule a Tour" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with the headline positioned off-center over a soft warm overlay; a horizontally-scrollable programs strip instead of a flat grid; a visual daily-timeline laid out as a gentle winding path rather than boxed steps; an image bleeding to the page edge with a safety badge overlapping its corner at least once; a pull-quote from a parent testimonial breaking the grid.
Home page: full-bleed hero image of children in a bright classroom with a soft overlay, trust-building headline set off-center, enrollment CTA; a horizontally-scrollable Programs strip (Infants, Toddlers, Pre-K) each with age range and daily focus; an About the Owner split section (photo one side, story the other, image bleeding past the section edge); safety and licensing badges band; a full-bleed testimonial band with one large auto-advancing parent quote.
Programs page: alternating asymmetric two-column sections per age group with a sample daily focus and milestones covered.
A Day Here page: a visual timeline (arrival, circle time, outdoor play, lunch, nap, art, pickup) laid out as a winding path with icons, plus a weekly sample menu table.
Our Staff page: a directory mixing one larger featured lead-teacher card with smaller staff cards, each with a warm bio and years of experience; safety/licensing credentials listed clearly.
Enrollment page: tuition tiers, enrollment steps as a simple numbered path, and an FAQ accordion for parents (illness policy, holidays, what to bring).
Contact page: compact hours/location column beside a large classroom photo bleeding to the page edge, inquiry form (parent name, child age, desired start date, message) as a separate card.
Soft sage, butter yellow, and blush accents on a cream base, rounded friendly sans-serif type throughout with a warm script accent for the daycare name only, gentle shadows, subtle real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },
  teacherClassroom: {
    name: "Teacher / Classroom Hub",
    category: "Family & Education",
    prompt: `Create a complete, polished multi-page classroom-communication website for an elementary teacher, Ms. Reyes, Room 14. Warm, organized, trustworthy — built for parents checking in and students feeling proud of their space. Build separate pages with a persistent nav (Home, This Week, Curriculum, Classroom Life, Resources, Contact) and smooth-scrolling within pages.
Avoid centered-heading-plus-3-card-grid — vary composition: a cheerful hero with the headline set off-center over a classroom photo; a horizontally-scrollable this-week strip instead of a flat five-box row; a visual daily-schedule laid out as a friendly timeline, not boxed steps; a classroom-rules section using icon-led rows rather than a card grid; an image bleeding to the page edge on the Classroom Life page.
Home page: warm hero image of the classroom with the teacher's name and room number set off-center, welcome message, dual CTAs (This Week in Class, Contact Ms. Reyes); a horizontally-scrollable This Week strip (Monday-Friday activities); an About the Teacher split section (photo one side, bio/philosophy/fun facts the other); three sample Announcements styled as a compact list, not cards.
This Week page: a day-by-day breakdown with subject blocks, laid out as a visual weekly timeline.
Curriculum page: curriculum-overview sections for reading, math, science, and social studies, each as an alternating asymmetric two-column block (icon/visual one side, description the other).
Classroom Life page: a kid-friendly Classroom Rules list with icons, a classroom-gallery masonry grid with tasteful placeholders, and homework/resource cards.
Resources page: downloadable-resource cards grouped by subject, plus a parent FAQ accordion.
Contact page: a form (parent name, email, student name, subject, message) beside a classroom photo, with office hours and email in the footer.
Bright but tasteful palette (sky blue, sunflower yellow, soft coral) on a clean white base, friendly rounded sans-serif type, premium and intentional rather than cluttered, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real classroom-appropriate content throughout.`
  },
  tutoringCenter: {
    name: "Tutoring / Learning Center",
    category: "Family & Education",
    prompt: `Create a complete, polished multi-page website for a local K-12 tutoring center called Keystone Learning Center, covering math, reading, and test prep. Trustworthy, results-focused, parent-friendly. Build separate pages with a persistent nav (Home, Subjects, Our Tutors, Results, Pricing, Contact) and a fixed "Free Assessment" button.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric hero pairing an outcome-driven headline with a tilted photo of a tutoring session bleeding off the edge; a horizontally-scrollable subjects strip instead of a flat grid; an oversized improvement statistic breaking out of its card on the Results page; a diagonal divider between two bands at least once; a pull-quote from a parent testimonial breaking the grid.
Home page: hero with an outcome-driven headline set off-center, a photo of a real tutoring moment bleeding to the edge, free-assessment CTA; a horizontally-scrollable How It Works strip (assessment, personalized plan, weekly sessions, progress reports); a Subjects grid by grade range laid out asymmetrically (one larger featured subject, smaller others); a Results band with oversized statistics (average grade improvement, students served, satisfaction rate); a full-bleed testimonial band with one large auto-advancing parent quote.
Subjects page: alternating asymmetric two-column sections per subject area (math, reading, test prep) with grade ranges and approach notes.
Our Tutors page: a directory mixing one larger featured tutor card with smaller cards, each with credentials, subjects, and a short teaching philosophy.
Results page: improvement statistics broken out with oversized numbers, plus two or three detailed parent/student testimonials in an editorial layout.
Pricing page: flexible plans (Per-Session, Monthly, Intensive) at differing card heights, a comparison table, and an FAQ accordion.
Contact page: a scheduling form (student grade, subject, availability) beside a photo of the learning center bleeding to the page edge.
Deep academic blue with a warm coral accent on a clean white base, confident sans-serif headings paired with a highly readable body font, generous whitespace, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, realistic content throughout.`
  },

  // Local Business
  localBakery: {
    name: "Bakery / Café",
    category: "Local Business",
    prompt: `Create a complete, polished multi-page website for an artisan neighborhood bakery called Hearth and Rye. Warm, inviting, premium-rustic — mouth-watering without being cluttered. Build separate pages with a persistent nav (Home, Menu, Custom Cakes, Our Story, Visit, Contact) and a fixed "Order Ahead" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image of fresh bread with the bakery name set off-center over a warm overlay; a horizontally-scrollable daily-specials strip instead of a flat grid; an image bleeding to the page edge with a price tag overlapping its corner at least once; an oversized pull-quote from the baker breaking the grid on the Our Story page; a soft angled divider between two bands at least once.
Home page: full-bleed hero image of signature pastries with a warm gradient overlay, headline set off-center, visit-us CTA; a horizontally-scrollable Daily Specials strip; a Menu Highlights split section (photo one side, a short curated list the other, image bleeding past the section edge); a full-bleed testimonial band with one large auto-advancing customer quote.
Menu page: menu grouped by breads, pastries, cakes, and coffee, laid out as a two-column list per category with real item names, short descriptions, and right-aligned prices in a distinct accent color, thin divider rules between items.
Custom Cakes page: an inquiry form (occasion, date, servings, flavor notes) beside a masonry gallery of past custom cakes at varied sizes.
Our Story page: editorial layout — large baker portrait on one side, an oversized pull-quote in italic serif breaking the grid, story text in a narrower column beside it, with a masonry strip of process/kitchen photos below at varied heights.
Visit page: hours, address, and parking notes in a compact column beside a large embedded-map placeholder, plus a newsletter-signup band closing the page with an oversized headline and inline email field.
Cream and espresso-brown palette with a warm honey accent, soft textured backgrounds, appetizing serif display headings paired with a clean sans body, hover states on menu items, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },
  autoRepair: {
    name: "Auto Repair Shop",
    category: "Local Business",
    prompt: `Create a complete, polished multi-page website for a family-owned auto repair shop called Trueline Auto Repair. Honest, competent, no-nonsense but friendly — built for a driver searching on their phone with a check-engine light on. Build separate pages with a persistent nav (Home, Services, Why Us, Meet the Team, Reviews, Contact) and fixed call-now plus book-online buttons.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric hero pairing a plain-language value promise with a photo of the shop floor bleeding off the edge; a horizontally-scrollable services strip instead of a flat grid; an oversized warranty/pricing statement breaking out of its card; a diagonal divider between two bands at least once; a pull-quote from a customer review breaking the grid.
Home page: hero with a plain-language headline (no jargon) set off-center, a real shop-floor photo bleeding to the edge, call-now and book-online CTAs; a horizontally-scrollable Services strip (Oil and Fluids, Brakes, Diagnostics, Tires, AC, Inspections) each with what's-included detail; a Why Drivers Trust Us band (certifications, warranty, straight-talk pricing policy) laid out asymmetrically, not equal boxes; a simple three-step How It Works path; a full-bleed testimonial band with one large auto-advancing review.
Services page: alternating asymmetric two-column sections per service with a what's-included list and typical turnaround time.
Why Us page: certifications, warranty terms, and pricing-transparency policy laid out with oversized trust statistics (years in business, cars serviced, average rating).
Meet the Team page: mechanics introduced by first name with years of experience and a specialty, in a directory mixing one larger featured card with smaller ones.
Reviews page: a mixed-size testimonial wall with star ratings and named customers.
Contact page: a service-request form (vehicle year/make/model, issue description, preferred date) beside a shop-exterior photo bleeding to the page edge, with hours, address, and phone in the footer.
Steel blue and safety-orange accents on clean white, bold readable sans-serif type sized generously for mobile, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — mobile-first, fully responsive, real content throughout.`
  },
  petServices: {
    name: "Pet Grooming / Services",
    category: "Local Business",
    prompt: `Create a complete, polished multi-page website for a pet grooming salon and daycare called Wag and Wash. Playful but polished — pet-lover warmth with professional trust. Build separate pages with a persistent nav (Home, Services, Meet the Groomers, Gallery, Daycare, Contact) and a fixed "Book an Appointment" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image of a happy pet mid-groom with the salon name set off-center over a warm overlay; a horizontally-scrollable services strip instead of a flat grid; a before/after image bleeding to the page edge with a paw-print accent overlapping its corner (used sparingly) at least once; a pull-quote from a wagging-tail testimonial breaking the grid; a soft angled divider between two bands at least once.
Home page: full-bleed hero image with a warm overlay, headline set off-center, book-appointment CTA; a horizontally-scrollable Services and Pricing strip (bath and brush, full groom, nail trim, daycare day passes) by dog size; a How Your Visit Works timeline styled as a friendly winding path; a full-bleed testimonial band with one large auto-advancing customer quote.
Services page: alternating asymmetric two-column sections per service category with pricing by size clearly laid out.
Meet the Groomers page: a directory mixing one larger featured groomer card with smaller ones, each introduced with their own pets and specialties; safety and certification badges band.
Gallery page: a masonry before/after grid mixing portrait and landscape crops with hover reveal.
Daycare page: a day-in-the-life visual timeline, safety details, and a day-pass pricing card.
Contact page: a booking form (pet name, breed, size, service, preferred date) beside a salon-interior photo bleeding to the page edge, plus an FAQ accordion (vaccines, matting, anxious pets) and hours/location in the footer.
Fresh teal and warm coral palette on a soft white base, rounded friendly sans-serif type, paw-print accents used sparingly, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Health & Wellness
  personalTrainer: {
    name: "Personal Trainer / Coach",
    category: "Health & Wellness",
    prompt: `Create a complete, polished multi-page website for an independent personal trainer, Coach Devon Marsh. High-energy but professional, motivating, credible, results-oriented. Build separate pages with a persistent nav (Home, Programs, Results, About, Pricing, Contact) and a fixed "Free Consult" button.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero action photo with the headline set off-center over a dark gradient overlay; a horizontally-scrollable client-results strip instead of a flat grid; an oversized before/after statistic breaking out of its card; a diagonal-cut divider between two contrasting bands at least once; a pull-quote from a client testimonial breaking the grid.
Home page: full-bleed hero action photo with a transformation-focused headline set off-center, free-consult CTA; a horizontally-scrollable Client Results strip with realistic before/after stats; a Training Options band (1-on-1, small group, online coaching, nutrition add-on) laid out with mismatched card sizes and pricing; a sample Week of Training shown as a visual timeline; a full-bleed dark testimonial band with one large auto-advancing quote.
Programs page: alternating asymmetric two-column sections per training option with what's-included detail and pricing.
Results page: an Instagram-style masonry gallery of transformation photos mixed with statistics breaking out of their cards, plus detailed client stories.
About page: editorial layout — large trainer photo on one side, an oversized pull-quote in italic serif breaking the grid, training philosophy and certifications in a narrower column beside it.
Pricing page: package cards of differing heights with a strong closing CTA band.
Contact page: a lead-capture form (goals, experience level, availability) beside an action photo bleeding to the page edge.
Charcoal base with an electric-lime accent, bold condensed display type paired with a clean sans body, athletic photography placeholders, real hover/scroll micro-interactions on cards, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },
  yogaStudio: {
    name: "Yoga / Wellness Studio",
    category: "Health & Wellness",
    prompt: `Create a complete, polished multi-page website for a neighborhood yoga and wellness studio called Still Water Yoga. Calm, welcoming, unhurried — every layout choice should feel like it's breathing. Build separate pages with a persistent nav (Home, Classes, Teachers, New Students, Workshops, Contact) and a soft "Begin Your Practice" CTA.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with generous negative space and the headline set off-center, not dead-center; a horizontally-scrollable class-strip instead of a flat weekly grid; a soft angled divider between two bands at least once; an oversized italic pull-quote breaking the grid on the Teachers page; an image bleeding to the page edge with a class-time overlapping its corner at least once.
Home page: full-bleed hero image with breathing-room negative space, headline set off-center, begin-your-practice CTA; a horizontally-scrollable This Week's Classes strip (vinyasa, restorative, beginners, prenatal) with instructor names and times; a New Student path teaser as a split-screen (photo one side, intro-offer the other, image bleeding past the section edge); gently-presented testimonials in a single-quote full-bleed band.
Classes page: a clean weekly schedule grid, styled with soft rounded cells rather than harsh boxes, filterable by class type.
Teachers page: editorial layout — large instructor photo on one side, an oversized pull-quote in italic serif breaking the grid, warm bio in a narrower column beside it, repeated for two or three teachers in alternating sides.
New Students page: an intro-offer pricing card, what-to-expect notes, and a first-class FAQ accordion.
Workshops page: a masonry grid of upcoming workshops and events at varied card sizes.
Contact page: a schedule-a-visit form beside a studio-interior photo bleeding to the page edge, membership and drop-in pricing listed clearly, address and socials in the footer.
Soft sand and sage palette on a warm white base, elegant thin-weight serif display type paired with a minimal sans body, generous whitespace, slow subtle real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, no cliché spiritual kitsch, real content throughout.`
  },

  // Professional Services
  lawFirm: {
    name: "Law Firm / Attorney",
    category: "Professional Services",
    prompt: `Create a complete, polished multi-page website for a small boutique law practice called Prescott Family Law, focused on family law, estate planning, and small-business matters. Serious, precise, reassuring — approachable without losing gravitas, noticeably more intimate than a big-firm site. Build separate pages with a persistent nav (Home, Practice Areas, About, What to Expect, Reviews, Contact) and a fixed free-consultation button.
Avoid centered-heading-plus-3-card-grid — vary composition: an asymmetric hero pairing a clear practice statement with a warm attorney portrait bleeding off the edge, not a stock skyline; a horizontally-scrollable practice-areas strip instead of a flat grid; an oversized pull-quote from a client testimonial breaking the grid, handled tastefully; a soft diagonal divider between two bands at least once.
Home page: hero with a clear, plain-language practice statement set off-center, a warm portrait of the attorney bleeding to the edge, free-consultation CTA; a horizontally-scrollable Practice Areas strip (Family Law, Estate Planning, Small Business, Real Estate) each with a plain-language description; a What to Expect teaser as a split-screen (icon/illustration one side, three-step summary the other); a full-bleed testimonial band with one large auto-advancing client quote, handled with care and no exaggerated claims.
Practice Areas page: alternating asymmetric two-column sections per area, translating legalese into concrete client benefits.
About page: editorial layout — large attorney portrait on one side, an oversized pull-quote in italic serif breaking the grid, bio and bar admissions in a narrower column beside it, with a note on approach and values.
What to Expect page: a first-time-client timeline (initial call, consultation, engagement, ongoing communication) as a gentle path rather than boxed steps, plus a fee-transparency note.
Reviews page: a mixed-size testimonial wall handled tastefully, no case outcomes promised.
Contact page: a consultation-request form (matter type, brief description, preferred contact method) beside an office photo bleeding to the page edge, with office hours, address, and required disclaimers in the footer.
Deep navy and warm parchment palette with a muted brass accent, serif display headings paired with a clean sans body, restrained real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },

  // Community & Culture
  nonprofitCharity: {
    name: "Nonprofit / Charity",
    category: "Community",
    prompt: `Create a complete, polished multi-page website for a local nonprofit called Harvest Table Coalition, focused on community food security. Hopeful, transparent, action-driving — grounded in real numbers, not vague appeals. Build separate pages with a persistent nav (Home, Our Programs, Get Involved, Impact, Stories, Contact) and fixed donate plus volunteer buttons in the header.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero image with the mission statement set off-center over a warm gradient overlay; a horizontally-scrollable programs strip instead of a flat grid; an oversized animated impact statistic breaking out of its card; a diagonal divider between two bands at least once; a respectful editorial pull-quote from a beneficiary breaking the grid on the Stories page.
Home page: full-bleed hero image with a warm gradient overlay, mission statement set off-center, prominent donate and volunteer CTAs; an impact-stats band with oversized animated counters (meals served, families helped, volunteers) laid out asymmetrically; a horizontally-scrollable Our Programs strip; a How Your Donation Helps breakdown with concrete examples per giving level shown as a stepped visual, not equal boxes; a full-bleed testimonial band with one large auto-advancing story handled respectfully.
Our Programs page: alternating asymmetric two-column sections per program (mobile pantry, community garden, school partnerships) with concrete numbers per program.
Get Involved page: a volunteer-opportunities grid with time commitments at mismatched sizes, upcoming-events list, and a volunteer-signup form.
Impact page: a transparency section with a financials-summary chart, board listing, and partner-organization logos.
Stories page: two beneficiary narratives told respectfully in an editorial two-column layout with portraits, plus a masonry strip of program-moment photos.
Contact page: compact office/hours column beside a large program photo bleeding to the page edge, newsletter signup and a donation CTA banner closing the page.
Warm optimistic harvest-gold and deep green palette on a soft cream base, human photography placeholders, accessible high-contrast confident sans-serif type, credibility-first design, real hover/scroll micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive, real content throughout.`
  },
  musicianBand: {
    name: "Musician / Band",
    category: "Entertainment",
    prompt: `Create a complete, polished website for an independent atmospheric-indie band called The Hollow Coast. Moody, cinematic, intimate — closer to a short film than a corporate band site. Build it as a single tall scroll with strong anchor navigation (Music, Tour, Story, Merch, Contact) rather than boxy separate pages — bold but hushed, not arena-rock loud.
Avoid centered-heading-plus-3-card-grid — vary composition: a full-bleed hero with the band name treatment huge and off-grid, cropped by the viewport edge; a horizontally-scrollable release strip instead of a flat grid; a tour-dates table with sold-out rows styled distinctly and at least one row breaking its grid with an oversized "Just Announced" tag; a diagonal-cut transition between two contrasting color bands at least once; an oversized italic press-quote breaking the type grid.
Hero section: full-bleed atmospheric image or single-color treatment with the band name set huge and off-center, listen-now CTA linking to a minimal visual player with the latest single's track list.
Music section: a horizontally-scrollable strip of past releases (singles, EP, album) with cover art and release years, plus the full track list of the latest release.
Tour section: a tour-dates table (date, city, venue, tickets button) with sold-out states, and at least one just-announced date breaking out of the row grid with an oversized badge.
Story section: an editorial split — a large moody band photo on one side, an oversized pull-quote from a member in italic serif breaking the grid, band story in a narrower column beside it, with a masonry strip of tour/studio photos below at varied heights, and short member cards with instruments.
Merch section: a small product grid (2-3 limited items) with hover-swap imagery.
Contact section: a booking-inquiry form (event type, date, venue capacity, message) beside one large atmospheric photo, plus social links and a press-kit download.
Deep charcoal-blue base with a single dusty-rose accent and soft grain texture, oversized elegant serif display type paired with a minimal sans body, hover glow micro-interactions, every image element using a real placehold.co URL sized to its container — never an empty colored box — fully responsive without losing atmosphere on mobile, real content throughout.`
  }
};

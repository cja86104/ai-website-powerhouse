/**
 * AI Website Powerhouse — 20 prompt templates
 *
 * Lifted verbatim from the legacy `components/AIWebsitePowerhouse.js`
 * monolith as part of the W1 PR-1 extraction. Each template body is the
 * exact prompt string the model is asked to generate against; do NOT
 * tweak whitespace, bullet ordering, or wording without an accompanying
 * regeneration test, because the model's output structure (and therefore
 * the multi-file parser's success rate) is sensitive to phrasing.
 *
 * Categories represented:
 *   Business · Marketing · E-commerce · Professional services ·
 *   Creative · SaaS · Education · Lifestyle · Entertainment ·
 *   Real Estate · Tech · Media · Community
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
 * Keyed catalog of the 20 production prompt templates. Indexed as
 * `Record<string, PromptTemplate>` rather than a stricter union type
 * because the legacy caller passes a string from a `<select>` value
 * (`handleSelectTemplate(templateKey: string)`).
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  // Business & Marketing
  saas_landing: {
    name: '🚀 SaaS Landing Page',
    category: 'Business',
    prompt: `Create a premium SaaS landing page with:
- Striking hero section with animated gradient background, compelling headline, subheadline, and dual CTAs (Start Free Trial + Watch Demo)
- Trust indicators: logos of major companies using the service
- Features section with 6 key features, each with icon, title, description
- Interactive product showcase with tab navigation showing different use cases
- Pricing section with 3 tiers: Starter, Professional, Enterprise (annual/monthly toggle)
- Social proof: testimonials carousel with photos, names, companies, ratings
- ROI calculator showing potential savings/gains
- FAQ accordion with 8-10 common questions
- Footer with company info, product links, resources, social media
Use modern gradients, micro-animations, glassmorphism effects. Make it conversion-focused and premium.`
  },

  agency_portfolio: {
    name: '💼 Creative Agency Portfolio',
    category: 'Business',
    prompt: `Create a stunning creative agency portfolio with:
- Full-screen video hero with overlay text, agency name, and scroll indicator
- Services section with 4-6 core offerings presented in an interactive grid
- Featured projects showcase with case studies (before/after, metrics, testimonials)
- Team section with photos, bios, social links for key members
- Client logos section with 12+ recognizable brands
- Awards & recognition section
- Process/methodology section showing how you work
- Blog/insights section with latest articles
- Contact form with office locations on a map
Use bold typography, strong imagery, parallax scrolling, smooth transitions. Premium agency aesthetic.`
  },

  ecommerce_fashion: {
    name: '👗 Fashion E-commerce Store',
    category: 'E-commerce',
    prompt: `Create a luxury fashion e-commerce store with:
- Elegant hero slider showcasing new collection
- Product grid with hover effects showing alternate images
- Quick view modal for products with image gallery, size selector, color swatches
- Filter sidebar: price range, size, color, brand, category
- Shopping cart with product thumbnails, quantity controls, promo code field
- Wishlist functionality
- Featured collections section
- Instagram feed integration mockup
- Style guide / lookbook section
- Email signup with discount offer
- Sticky header with cart icon showing item count
Premium fashion aesthetic with clean typography, elegant spacing, sophisticated color palette.`
  },

  restaurant_menu: {
    name: '🍽️ Restaurant Website',
    category: 'Business',
    prompt: `Create an upscale restaurant website with:
- Full-screen hero with restaurant ambiance photo, tagline, reservation CTA
- Menu section with tabs for Appetizers, Mains, Desserts, Drinks (each with descriptions, prices, dietary icons)
- Photo gallery showcasing dishes and restaurant interior
- Chef's profile section with bio and philosophy
- Reservation system mockup with date/time picker, party size
- Location & hours with embedded map mockup
- Private events section
- Reviews/testimonials carousel
- Instagram feed of food photos
- Newsletter signup for special offers
Elegant design with food photography focus, warm color scheme, sophisticated typography.`
  },

  // Professional Services
  law_firm: {
    name: '⚖️ Law Firm Website',
    category: 'Professional',
    prompt: `Create a professional law firm website with:
- Authoritative hero with firm name, tagline, free consultation CTA
- Practice areas grid (Corporate Law, Real Estate, Family Law, Criminal Defense, etc.)
- Attorney profiles with headshots, credentials, specializations, contact info
- Case results/success stories with statistics
- Client testimonials with full quotes
- Legal resources/blog section
- FAQ section for common legal questions
- Multi-step contact form with case type selector
- Trust indicators: years in practice, cases won, awards
Conservative, trustworthy design with navy/gold color scheme, professional typography, credibility-focused.`
  },

  medical_clinic: {
    name: '🏥 Medical Clinic Website',
    category: 'Professional',
    prompt: `Create a modern medical clinic website with:
- Clean hero with clinic name, services overview, appointment booking CTA
- Services section with detailed descriptions (General Practice, Pediatrics, Women's Health, etc.)
- Doctor profiles with photos, specializations, education, languages spoken
- Online appointment booking system mockup with calendar, time slots
- Patient portal login mockup
- Insurance providers accepted
- Health resources/blog
- Virtual consultation option highlight
- Patient testimonials
- Location, hours, contact information
- Emergency contact information
Clean, calming design with blues/greens, accessible typography, trust-building elements.`
  },

  // Creative & Media
  photography_portfolio: {
    name: '📸 Photography Portfolio',
    category: 'Creative',
    prompt: `Create a stunning photography portfolio with:
- Full-screen image hero with photographer name and tagline
- Gallery with categories: Weddings, Portraits, Commercial, Landscape (filterable)
- Masonry grid layout with lightbox functionality
- Individual project pages with photo series and project descriptions
- About section with photographer bio, approach, equipment
- Services & pricing packages
- Client testimonials with photos from their shoots
- Instagram-style feed section
- Contact form with shoot type selector
- Print shop section for purchasing prints
Minimalist design focused on imagery, subtle animations, elegant typography, black & white accents.`
  },

  video_production: {
    name: '🎬 Video Production Studio',
    category: 'Creative',
    prompt: `Create a dynamic video production website with:
- Auto-playing showreel hero (muted) with play/pause control
- Services: Corporate Videos, Commercials, Music Videos, Event Coverage, Animation
- Portfolio grid with video thumbnails and project details
- Client logos carousel
- Production process timeline
- Team section with roles (Directors, Cinematographers, Editors)
- Equipment & technology showcase
- Pricing packages for different video types
- Testimonials with embedded client videos
- Blog with video production tips
- Contact form with project brief upload
Bold, cinematic design with dark theme, vibrant accents, video-centric layout.`
  },

  // Tech & SaaS
  project_management: {
    name: '📊 Project Management Dashboard',
    category: 'SaaS',
    prompt: `Create a comprehensive project management dashboard with:
- Sidebar navigation: Dashboard, Projects, Tasks, Team, Reports, Settings
- Top bar with search, notifications, user profile dropdown
- Overview cards: Active Projects, Tasks Due Today, Team Members, Completion Rate
- Kanban board with drag-and-drop columns (To Do, In Progress, Review, Done)
- Calendar view with upcoming deadlines
- Team activity feed
- Progress charts: project timeline, task distribution, team workload
- Quick actions: Create Project, Assign Task, Add Team Member
- Recent projects list with progress bars
- Upcoming deadlines list
Modern SaaS UI with sidebar, cards, charts, clean data presentation, responsive layout.`
  },

  analytics_dashboard: {
    name: '📈 Analytics Dashboard',
    category: 'SaaS',
    prompt: `Create a data analytics dashboard with:
- Comprehensive metrics overview: Users, Revenue, Conversion Rate, Session Duration
- Line chart showing growth over time (daily/weekly/monthly toggle)
- Geographic user map with data points
- Traffic sources pie chart (Organic, Paid, Social, Direct)
- Top performing pages table with metrics
- Real-time activity feed
- Conversion funnel visualization
- User demographics breakdown (age, gender, device)
- Date range picker for data filtering
- Export data functionality
- Comparison mode (current vs previous period)
Professional analytics aesthetic with charts, graphs, data tables, clean information hierarchy.`
  },

  // Education & Learning
  online_course: {
    name: '🎓 Online Course Platform',
    category: 'Education',
    prompt: `Create an engaging online course platform with:
- Hero with course title, instructor info, enroll CTA, course preview video
- Course curriculum accordion showing modules and lessons
- What you'll learn section with key outcomes
- Instructor bio with credentials, photo, social proof
- Student testimonials with ratings and progress stories
- Course features: Lifetime access, Certificate, Resources, Community
- Pricing options: Single payment, payment plan, enterprise
- FAQ section
- Related courses section
- Requirements and target audience
- Sample lesson preview
- Stats: students enrolled, rating, lessons, duration
Modern e-learning design with course structure focus, progress indicators, engaging visuals.`
  },

  university_website: {
    name: '🏛️ University Website',
    category: 'Education',
    prompt: `Create a comprehensive university website with:
- Hero carousel: Campus life, Academic excellence, Research highlights
- Quick links: Apply Now, Visit Campus, Programs, Admissions
- Programs by school/department with filterable categories
- Upcoming events calendar
- News & announcements section
- Student life showcase with photos and testimonials
- Research highlights and publications
- Campus tour virtual walkthrough mockup
- Admissions process timeline
- Tuition & financial aid information
- Faculty spotlight
- Alumni success stories
- Sports and activities section
Academic institution design with traditional colors, organized information architecture, credibility focus.`
  },

  // Entertainment & Lifestyle
  fitness_gym: {
    name: '💪 Fitness Studio Website',
    category: 'Lifestyle',
    prompt: `Create an energetic fitness studio website with:
- Dynamic hero with workout image, motivational tagline, free trial CTA
- Class schedule grid with times, instructors, difficulty levels
- Membership pricing tiers with benefits comparison
- Trainer profiles with specializations, certifications, book session buttons
- Virtual classes section
- Success stories with before/after photos and testimonials
- Facilities tour photo gallery
- Mobile app promotion section
- Blog with workout tips and nutrition advice
- Location and contact information
- Social media feed
- Limited time offer banner
High-energy design with bold colors, fitness photography, motivational messaging, strong CTAs.`
  },

  music_band: {
    name: '🎸 Music Band Website',
    category: 'Entertainment',
    prompt: `Create a rock band website with:
- Full-screen hero with band photo, latest album cover, listen now CTA
- Music player with latest album tracks (visual player interface)
- Tour dates section with venues, cities, ticket links
- Band bio and member profiles with instruments
- Discography showcase with album covers and release years
- Video section with music videos and live performances
- Photo gallery from concerts and studio sessions
- Merchandise store section
- Mailing list signup for tour announcements
- Social media integration
- Press kit download section
Edgy, music-focused design with dark theme, album artwork, concert photography, vibrant accents.`
  },

  // Real Estate & Property
  real_estate_luxury: {
    name: '🏡 Luxury Real Estate',
    category: 'Real Estate',
    prompt: `Create a high-end real estate website with:
- Full-screen hero video of luxury property with search overlay
- Advanced property search: location, price range, bedrooms, property type, features
- Featured listings grid with hover details (price, beds, baths, sqft, location)
- Property details page with image gallery, virtual tour button, amenities list
- Neighborhood guide with schools, shopping, dining ratings
- Mortgage calculator
- Agent profile with photo, bio, listings, contact
- Market insights and trends section
- Testimonials from satisfied buyers/sellers
- Schedule viewing form
- Recently sold properties
- Newsletter signup
Luxurious design with elegant typography, high-quality imagery, sophisticated color palette, premium feel.`
  },

  // Technology & Startup
  crypto_exchange: {
    name: '₿ Crypto Trading Platform',
    category: 'Tech',
    prompt: `Create a cryptocurrency exchange interface with:
- Dashboard header with portfolio value, 24h change, account menu
- Live price ticker for major cryptocurrencies
- Trading chart with candlesticks, volume, technical indicators
- Order book showing buy/sell orders
- Buy/Sell panel with amount input, price, total calculation
- Portfolio overview with asset allocation pie chart
- Transaction history table
- Market overview: trending coins, gainers, losers
- Quick trade section for instant buy/sell
- Security features showcase
- Deposit/Withdraw functionality mockup
- Price alerts setup
- Referral program section
Modern fintech UI with dark mode, real-time data displays, charts, professional trading aesthetic.`
  },

  ai_saas_tool: {
    name: '🤖 AI SaaS Tool',
    category: 'Tech',
    prompt: `Create an AI-powered SaaS platform with:
- Hero explaining AI capability with interactive demo
- Use cases section showing different applications
- Live AI demo/playground interface
- Feature comparison: Free vs Pro vs Enterprise
- API documentation teaser
- Integration showcase with popular tools
- Results showcase with metrics (time saved, accuracy improved, cost reduced)
- Pricing with usage-based tiers
- Customer logos and testimonials
- Use case templates gallery
- Getting started tutorial section
- Security and compliance badges
- Developer documentation link
Cutting-edge tech design with gradients, AI-themed visuals, modern UI patterns, innovation focus.`
  },

  // Blog & Content
  magazine_blog: {
    name: '📰 Digital Magazine',
    category: 'Media',
    prompt: `Create a modern digital magazine website with:
- Featured story hero with large image, headline, excerpt, read time
- Category navigation: Technology, Business, Lifestyle, Culture, Opinion
- Article grid with thumbnail, category tag, title, excerpt, author, date
- Trending articles sidebar
- Newsletter signup with benefits
- Author profiles with bio, social links, articles count
- Article page with featured image, formatted content, related articles
- Comments section
- Social sharing buttons
- Search functionality
- Popular tags cloud
- Latest videos/podcasts section
- Advertisement spaces mockup
Editorial design with strong typography, clean reading experience, organized content hierarchy.`
  },

  // Community & Social
  nonprofit_charity: {
    name: '❤️ Nonprofit Organization',
    category: 'Community',
    prompt: `Create an impactful nonprofit website with:
- Emotional hero with mission statement, powerful image, donate CTA
- Mission and impact section with statistics
- Current campaigns/projects with progress bars
- Ways to help: Donate, Volunteer, Sponsor, Fundraise
- Success stories with photos and testimonials
- Donation form with amount selection, recurring option
- Volunteer signup form
- Upcoming events calendar
- Team and board members
- Financial transparency section with annual report
- Partner organizations logos
- Blog with impact stories
- Newsletter signup
Compassionate design with warm colors, inspiring imagery, clear calls to action, impact focus.`
  },

  wedding_planning: {
    name: '💒 Wedding Planning',
    category: 'Lifestyle',
    prompt: `Create an elegant wedding planning website with:
- Romantic hero with couple photo, names, date, countdown timer
- Our story timeline
- Wedding event details: ceremony, reception, accommodations
- RSVP form with meal selection, plus-one option
- Wedding party section with photos and bios
- Registry links to multiple stores
- Photo gallery from engagement shoot
- Travel information for out-of-town guests
- Schedule of events (welcome dinner, ceremony, reception, brunch)
- FAQ section
- Guestbook/messages section
- Playlist song request form
- Live streaming information for virtual guests
Romantic design with soft colors, elegant typography, beautiful imagery, personal touches.`
  },

  // ── Expanded library (2026-07-11) — richer, more prescriptive
  // prompts modeled on the detailed style that produces the best
  // real-world results (daycare/teacher test sessions). Existing
  // entries above are untouched per the header warning.

  // Family & Education
  kidsDaycare: {
    name: "Daycare / Childcare Center",
    category: "Family & Education",
    prompt: `Create a complete, polished website for a small family-run daycare called Little Sprouts. Warm, nurturing, professional — appeals to parents, never childish or cartoonish. Include: hero with trust-building headline and enrollment CTA; About Us with the owner story and credentials; Programs section (infants, toddlers, pre-K) as rounded cards with age ranges and daily focus; A Day at Little Sprouts visual timeline (arrival, circle time, outdoor play, lunch, nap, art); staff introductions with warm bios; safety and licensing badges section; weekly sample menu table; parent testimonials; tuition and enrollment steps; FAQ accordion for parents; contact section with hours, address, and an inquiry form (parent name, child age, desired start date, message). Soft sage/butter/blush palette on cream, rounded cards, gentle shadows, subtle animations, fully responsive, real content throughout.`
  },
  teacherClassroom: {
    name: "Teacher / Classroom Hub",
    category: "Family & Education",
    prompt: `Create a complete website for an elementary school teacher: a classroom communication hub for parents and students. Warm, trustworthy, organized. Include: sticky nav with smooth scrolling; cheerful hero with two CTAs; About the Teacher with bio, philosophy, and fun facts; Daily Schedule visual timeline; This Week in Class with Monday-Friday activities; Curriculum Overview cards for reading, math, science, social studies; kid-friendly Classroom Rules with icons; Homework and Resources cards; Announcements with three sample updates; parent FAQ accordion; classroom gallery with tasteful placeholders; contact form (parent name, email, student name, subject, message); footer with office hours and email. Bright but not garish, rounded cards, friendly typography, premium and intentional, real teacher-appropriate content.`
  },
  tutoringCenter: {
    name: "Tutoring / Learning Center",
    category: "Family & Education",
    prompt: `Create a professional website for a local tutoring center covering K-12 math, reading, and test prep. Trustworthy, results-focused, parent-friendly. Include: hero with outcome-driven headline and free-assessment CTA; How It Works in three steps; Subjects grid with grade ranges; Meet the Tutors cards with credentials; Results section with improvement stats and parent testimonials; flexible Pricing plans (per-session, monthly, intensive); an FAQ accordion; scheduling contact form (student grade, subject, availability). Clean academic palette (deep blue, warm accent), generous whitespace, card-based layout, subtle motion, fully responsive, realistic content.`
  },

  // Local Business
  localBakery: {
    name: "Bakery / Café",
    category: "Local Business",
    prompt: `Create a mouth-watering website for an artisan neighborhood bakery. Warm, inviting, premium-rustic. Include: hero with signature product photography placeholder and visit-us CTA; Our Story section with baker bio; Menu grid grouped by breads, pastries, cakes, coffee with real item names and prices; Daily Specials strip; custom cake ordering section with an inquiry form (occasion, date, servings, flavor notes); gallery grid; testimonials; visit section with hours, address, parking notes, and an embedded-map placeholder; newsletter signup CTA. Cream and espresso palette with a warm accent, soft textures, appetizing typography, hover states on menu cards, fully responsive.`
  },
  autoRepair: {
    name: "Auto Repair Shop",
    category: "Local Business",
    prompt: `Create a trust-first website for a family-owned auto repair shop. Honest, competent, no-nonsense but friendly. Include: hero with plain-language value promise and call-now plus book-online CTAs; Services grid (oil and fluids, brakes, diagnostics, tires, AC, inspections) with what-is-included detail; Why Drivers Trust Us with certifications, warranty, and straight-talk pricing policy; simple three-step How It Works; mechanics introduced by first name with years of experience; reviews section; service-request form (vehicle year/make/model, issue description, preferred date); footer with hours, address, phone. Steel blue and safety-orange accents on clean white, bold readable type, mobile-first for roadside searches.`
  },
  petServices: {
    name: "Pet Grooming / Services",
    category: "Local Business",
    prompt: `Create a delightful website for a pet grooming salon and daycare. Playful but polished — pet-lover warmth with professional trust. Include: hero with happy-pet imagery placeholder and book-appointment CTA; Services and pricing cards (bath and brush, full groom, nail trim, daycare day passes) by dog size; How Your Visit Works timeline; groomer team bios with their own pets; before/after gallery grid; safety and certification badges; wagging-tail testimonials; booking form (pet name, breed, size, service, preferred date); FAQ accordion (vaccines, matting, anxious pets); footer with hours and location. Fresh teal and warm coral palette, rounded everything, paw-print accents used sparingly, fully responsive.`
  },

  // Health & Wellness
  personalTrainer: {
    name: "Personal Trainer / Coach",
    category: "Health & Wellness",
    prompt: `Create a high-energy but professional website for an independent personal trainer. Motivating, credible, results-oriented. Include: hero with transformation-focused headline and free-consult CTA; About with certifications and training philosophy; Training Options cards (1-on-1, small group, online coaching, nutrition add-on) with pricing; Client Results section with realistic before/after stats and testimonials; a sample Week of Training timeline; Instagram-style gallery strip; lead-capture form (goals, experience level, availability); FAQ accordion; strong CTA banner. Charcoal base with electric accent color, bold condensed headings, athletic photography placeholders, micro-interactions on cards, fully responsive.`
  },
  yogaStudio: {
    name: "Yoga / Wellness Studio",
    category: "Health & Wellness",
    prompt: `Create a serene, premium website for a neighborhood yoga and wellness studio. Calm, welcoming, unhurried. Include: hero with breathing-room layout and begin-your-practice CTA; class schedule as a clean weekly grid (vinyasa, restorative, beginners, prenatal) with instructor names and times; Instructors section with warm bios; New Student path with intro-offer pricing card; Workshops and Events cards; studio gallery; testimonials presented gently; membership and drop-in pricing; contact section with schedule-a-visit form; footer with address and socials. Soft sand and sage palette, elegant thin typography, generous whitespace, slow subtle transitions, fully responsive, no cliché spiritual kitsch.`
  },

  // Professional Services
  lawFirm: {
    name: "Law Firm / Attorney",
    category: "Professional Services",
    prompt: `Create an authoritative, client-friendly website for a small law practice. Serious, precise, reassuring — approachable without losing gravitas. Include: hero with clear practice statement and free-consultation CTA; Practice Areas grid (family law, estate planning, small business, real estate) each with plain-language descriptions; attorney profiles with credentials and bar admissions; Our Approach section translating legalese into client benefits; case-results or client testimonials handled tastefully; a What to Expect timeline for first-time clients; consultation request form (matter type, brief description, preferred contact); footer with office hours, address, and required disclaimers. Deep navy and parchment palette, serif display headings with clean body text, restrained animation, impeccable spacing, fully responsive.`
  },

  // Community & Culture
  nonprofitCharity: {
    name: "Nonprofit / Charity",
    category: "Community",
    prompt: `Create an inspiring website for a local nonprofit focused on community food security. Hopeful, transparent, action-driving. Include: hero with mission statement and prominent donate plus volunteer CTAs; impact stats band (meals served, families helped, volunteers) with animated counters; Our Programs cards; How Your Donation Helps breakdown with concrete examples per giving level; volunteer opportunities grid with time commitments; upcoming events list; stories section with two beneficiary narratives told respectfully; transparency section (financials summary, board); newsletter signup; donation CTA banner. Warm optimistic palette, human photography placeholders, accessible high-contrast text, credibility-first design, fully responsive.`
  },
  musicianBand: {
    name: "Musician / Band",
    category: "Entertainment",
    prompt: `Create an electric one-page website for an independent band. Bold, atmospheric, tour-ready. Include: full-bleed hero with band name treatment and listen-now CTA; latest release section with streaming-platform link buttons; tour dates table (date, city, venue, tickets button) with sold-out states; About the Band with member cards; music video or photo gallery grid; press quotes strip; merch teaser cards; mailing list signup with incentive; booking contact form; footer with social links. Dark theatrical palette with one neon accent, oversized typography, texture and grain, hover glow effects, fully responsive without losing drama on mobile.`
  }
};

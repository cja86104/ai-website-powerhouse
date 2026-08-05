# BUILD PROMPT — Copy/paste this whole block into your builder

You are building a **premium, custom-designed marketing website for a tattoo studio**. This is not a generic template job — the client is paying $10,000+ for this build and expects a site that looks hand-designed by a senior studio, not something assembled from an AI-website-builder starter kit. Treat every design decision as deliberate. If you find yourself reaching for a default choice ("Inter font," "blue-to-purple gradient hero," "rounded-full pill buttons," "3 icon cards under a hero," "emoji as icons"), stop and pick something else. Genericness is a failure condition on this project, equal in severity to a bug.

Read this entire prompt before writing any code. Build in the order the sections appear. Do not skip the design-system section to jump to code — the design system is what prevents this from looking like every other AI-generated site.

---

## 1. Studio identity (placeholder — client will swap real details in later)

- **Studio name:** Black Anchor Tattoo Co.
- **Tagline:** "Permanent work. No half measures."
- **City/vibe:** Independent street-shop turned appointment-only studio — not a corporate chain, not a boardwalk walk-in shop. Think exposed brick, single work stations, artists who've been doing this 10+ years.
- **Tone of voice:** Confident, dry, a little blunt, zero corporate marketing-speak. No "unleash your inner canvas" nonsense. Talk to the reader like a professional talks to a client who already wants the work done — respectful, direct, no hard sell.
- Mark every piece of studio-specific text (address, phone, real artist names, real prices) with `{{PLACEHOLDER: description}}` so the client can find/replace instantly during handoff. Do not leave literal "Lorem ipsum" anywhere — write real, finished, on-voice copy for every section; only facts unique to the real business (exact address, license numbers, real legal name) get the placeholder treatment.

---

## 2. Tech stack — hard requirements

- **React 18 + Vite.** `npm create vite@latest` scaffold, TypeScript is preferred but plain JS is acceptable if it ships faster — pick one and be consistent.
- **React Router v6+ for real, separate pages.** Every page below is its own route AND its own component file under `src/pages/`. Do not build this as a single-page app with anchor-scroll sections pretending to be pages. Each route must be independently linkable, independently loadable, and have its own `<title>`/meta tags (use `react-helmet-async` or manual `document.title` updates in a `useEffect`).
- Component structure:
  - `src/pages/` — one file per route (Home.jsx, Artists.jsx, ArtistProfile.jsx, Gallery.jsx, Services.jsx, Booking.jsx, Aftercare.jsx, FAQ.jsx, Studio.jsx, Contact.jsx, NotFound.jsx)
  - `src/components/` — shared UI (Navbar, Footer, GrainOverlay, SectionHeading, Marquee, ImageReveal, ArtistCard, PortfolioGrid, BookingForm, etc.)
  - `src/data/` — artist data, portfolio image metadata, pricing data as structured JS/JSON, not hardcoded inline in JSX
  - `src/styles/` — global design tokens (colors, spacing, type scale) in one place, imported everywhere else
- No Next.js, no server-side anything — this is a static Vite SPA suitable for Netlify/Vercel/static hosting.
- Fully responsive: mobile (375px), tablet (768px), desktop (1280px+), and a wide-desktop check at 1920px. Test the nav and gallery grid at all four.
- Lazy-load route components with `React.lazy` + `Suspense` so the initial bundle stays lean.

---

## 3. Design system — the part that prevents this from looking AI-generated

**Anti-pattern list — none of the following are allowed anywhere on this site:**
- Purple-to-blue, purple-to-pink, or any multi-hue gradient "bleed" backgrounds (the wash of 3+ colors blending across a hero section). This is the single most recognizable AI-website tell — do not use it, not even toned down.
- Generic centered hero with a gradient blob behind it and a single centered CTA button
- Rounded-full / pill-shaped buttons as the default button shape
- Inter, Poppins, or Roboto as the primary display font (fine as a body/UI fallback only if paired with a distinctive display face — see typography below)
- Emoji used as section icons or bullet markers
- Three (or four) identical icon-cards-in-a-row as a "features" section
- Stock "smiling business person pointing at laptop" photography
- Soft pastel drop shadows on every card (the "everything floats 8px above a light-gray background" look)

**Color palette — strict, high-contrast, ink-shop atmosphere. No color bleed.**
- Background (primary): `#0B0B0C` — near-black, slightly warm, not pure `#000`
- Background (secondary/panels): `#161618`
- Ink/accent (the ONE signature color — use sparingly, for CTAs, links, active states, and small detail accents only): `#C4402A` — a dried-blood/burnt-rust red. Do not introduce a second accent hue. Where a second tone is needed for hierarchy, use a warm off-white instead of another color.
- Text primary: `#EDEAE4` (warm bone white, not pure `#FFF`)
- Text muted: `#8A8783`
- Borders/dividers: `#2A2A2C`, 1px hairlines only — no soft box-shadows as the primary depth cue. Use hairline borders and grain texture for depth instead of shadow blur.
- This is a two-and-a-half color system (near-black, bone white, one rust-red accent). That constraint is intentional — it's what "no multi-color bleed" means in practice. Enforce it on every page.

**Typography:**
- Display/heading font: something with real character and a tattoo/print-shop edge — e.g. a condensed industrial serif or a bold slab (Google Fonts options: "Bebas Neue" for oversized display type, or "Fraunces" / "Playfair Display" at heavy weight for an engraved-plate feel). Pick one and commit — headings should feel stamped, not app-like.
- Body font: a clean, highly legible workhorse — "Inter" is fine here ONLY as body copy, never for headings, or swap for "Neue Montreal"/"General Sans" if available.
- Set an explicit type scale in the design tokens file (e.g. h1 clamp(2.5rem, 6vw, 5.5rem), h2 clamp(2rem, 4vw, 3.5rem), body 1rem/1.05rem) and use it everywhere — no ad hoc font sizes scattered through components.
- Use generous letter-spacing on all-caps labels/eyebrows (e.g. "OUR WORK", "BOOK A SESSION") to reinforce the stamped/engraved feel.

**Layout personality — asymmetry over centered-card grids:**
- Avoid perfectly centered, symmetric layouts as the default. Use off-center headlines, full-bleed images that break the container edge, overlapping text-over-image compositions, and a visible grid where the gallery images are intentionally uneven sizes (masonry-style, not a uniform 3-col grid of identical squares).
- Add a subtle film-grain/noise texture overlay (CSS `background-image` with a tiled noise PNG or an SVG turbulence filter) across the whole site at low opacity — this alone does a lot to kill the "flat AI gradient" look.
- Section transitions: use a thin horizontal hairline + an all-caps section label (e.g. "02 — ARTISTS") instead of big rounded card containers for every section.
- Micro-interactions: image reveal-on-scroll (clip-path or opacity/translate reveal via IntersectionObserver), a marquee/ticker strip somewhere (e.g. scrolling list of tattoo styles: "TRADITIONAL — BLACKWORK — FINE LINE — JAPANESE — REALISM —"), cursor-follow accent dot on desktop viewports (optional, nice-to-have, skip if it threatens performance).
- Buttons: rectangular or barely-clipped-corner, not pill-shaped. Primary CTA = solid rust-red fill with bone-white text; secondary = hairline outline with text, fills on hover.

---

## 4. Images — use real, free, license-clear stock photos that match the content

You cannot generate real tattoo photography, so source actual stock photos per section. Use **Unsplash** and **Pexels** (both free for commercial use, no attribution legally required, but add a credit in the footer as good practice — "Photography via Unsplash/Pexels"). Pull real image URLs (Unsplash source/API or Pexels API/direct CDN links), not placeholder gray boxes.

For each image slot, search using these specific queries so the images actually match the subject — don't drop random "moody dark photo" stock into a slot that's supposed to show a tattoo:

- Hero/homepage banner: "tattoo artist working closeup", "tattoo machine ink hand"
- Studio/interior shots: "tattoo studio interior", "tattoo shop dark interior", "industrial studio workspace"
- Artist portraits: "tattoo artist portrait", "portrait artist studio black and white" (pick portraits with a moody, low-key lighting feel to match the palette)
- Portfolio/gallery grid: search per style — "blackwork tattoo", "fine line tattoo", "traditional tattoo arm", "Japanese irezumi tattoo", "realism portrait tattoo", "geometric tattoo design" — build a grid that's genuinely mixed by style, not 12 copies of the same search result
- Aftercare page: "tattoo aftercare healing", "skincare hands closeup"
- Booking/contact page: "tattoo consultation", "notebook sketch design desk"
- Texture/detail accents: "skin texture macro", "ink splash black" (used small, as design accents, not full-bleed)

Implementation notes:
- Serve images via the direct Unsplash/Pexels CDN URL with size params (e.g. Unsplash `?w=1200&q=80&auto=format`) rather than downloading and rehosting, unless the client wants them self-hosted for reliability — if self-hosting, note it in a README so the client knows to keep local copies.
- Every `<img>` gets real, descriptive `alt` text matching what's actually in the photo (accessibility + SEO), not "image1.jpg" or "placeholder".
- Use `loading="lazy"` on every below-the-fold image and explicit `width`/`height` (or `aspect-ratio` CSS) to prevent layout shift.
- Convert/serve as WebP where the source allows it, or rely on Unsplash's `auto=format` param to let the CDN do it.

---

## 5. Pages (each is a separate route + separate file)

1. **Home (`/`)** — Full-bleed hero with hero photo + tagline, brief studio intro, style-ticker marquee, 3–4 featured portfolio pieces linking to Gallery, artist teaser strip linking to Artists, a "Book a Consultation" CTA band, footer.
2. **Artists (`/artists`)** — Grid of artist cards (photo, name, specialty style, Instagram-style handle placeholder), each card links to that artist's profile page.
3. **Artist Profile (`/artists/:slug`)** — Individual bio, specialty styles, portrait, a mini portfolio grid of just their work, a "Book with [Artist]" CTA.
4. **Gallery/Portfolio (`/gallery`)** — Masonry-style grid, filterable by style (Traditional, Blackwork, Fine Line, Japanese, Realism, Geometric) using client-side filter state — no page reload.
5. **Services & Pricing (`/services`)** — Style categories explained, hourly/session rate ranges (placeholder numbers, clearly marked), deposit policy, what's included.
6. **Booking / Consultation (`/booking`)** — A real, validated multi-field form (name, email, phone, preferred artist dropdown, style, placement, size, reference-image upload input, message) with client-side validation and a friendly success state. No backend is required — wire the submit handler to a clearly marked `{{TODO: connect to booking backend / email service}}` stub, but the form UI/UX must be fully built and functional up to that point.
7. **Aftercare (`/aftercare`)** — Real, useful aftercare instructions written in the studio's voice, structured with clear steps/timeline (first 24 hrs, week 1, healing complete), plus a "signs of infection — call us" callout box.
8. **Studio / About (`/studio`)** — Studio history, hygiene/safety standards (autoclave, single-use needles, license info placeholder), interior photos, hours, location map placeholder.
9. **FAQ (`/faq`)** — Real accordion-style FAQ (age requirements, walk-ins vs. appointments, payment, touch-ups, pain expectations, deposit/cancellation policy).
10. **Contact (`/contact`)** — Address, phone, hours, embedded map placeholder, social links, and a short contact form (separate from the full booking form — this one's just "general question").
11. **404 (`*`)** — On-brand not-found page, not the framework default.

Shared across all pages: sticky/transparent-to-solid navbar on scroll, footer with hours/address/social/photo-credit line.

---

## 6. Non-negotiable quality bar

- No Lorem ipsum, no "Company Name," no gray placeholder boxes where an image should be — every image slot gets a real sourced photo per section 4.
- No console errors or warnings on any route.
- Lighthouse targets: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95 on desktop throw (mobile will be lower due to images — still lazy-load and size everything properly).
- Every interactive element (buttons, links, form fields, filter pills) has a visible focus state and is keyboard-navigable.
- Provide a top-level `README.md` explaining: how to run (`npm install && npm run dev`), the design-token file location, where to swap placeholder content, and image licensing notes.
- Ship complete, working code for every file — no truncated components, no "// rest of component here" stubs. If a file is long, that's fine; completeness matters more than brevity.

Build it exactly to this spec. Where you have genuine creative discretion (exact marquee wording, exact card hover animation curve, exact FAQ questions), make sharp, specific choices in keeping with the tone above rather than defaulting to the safest generic option.

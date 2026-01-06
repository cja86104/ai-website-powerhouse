'use client'

import { useState, useRef, useEffect, useCallback, useMemo, Component, memo } from 'react'
import {
  Send, Settings, Loader2, Download, Code, FileCode, FolderOpen,
  X, Github, Sliders, Database, GitBranch, Upload,
  CloudDownload, Eye, AlertCircle, Archive, Trash2, Undo
} from 'lucide-react'

// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Something Went Wrong
            </h2>
            <p className="text-red-200 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Debounce function for auto-save
function debounce(func, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// 20 PROFESSIONAL PROMPT TEMPLATES
const PROMPT_TEMPLATES = {
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
  }
}

// Memoized Deploy Modal Component
const DeployModal = memo(({ isOpen, onClose }) => {
  const [deployTarget, setDeployTarget] = useState('netlify')

  const generateNetlifyInstructions = useCallback(() => {
    return `# Deploy to Netlify

## Option 1: Netlify CLI (Recommended)
1. Install Netlify CLI:
   npm install -g netlify-cli

2. Navigate to your project folder and run:
   netlify deploy

3. Follow the prompts:
   - Authorize Netlify (first time only)
   - Create new site or link existing
   - Deploy directory: ./ (current directory)

4. For production deployment:
   netlify deploy --prod

## Option 2: Netlify Drop
1. Go to https://app.netlify.com/drop
2. Drag and drop your ZIP file
3. Site will be live instantly!

## Option 3: Git Integration
1. Push your code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" → "Import existing project"
4. Connect your GitHub repository
5. Configure:
   - Build command: (leave empty for static sites)
   - Publish directory: ./
6. Click "Deploy site"

Your site will auto-deploy on every git push!`
  }, [])

  const generateVercelInstructions = useCallback(() => {
    return `# Deploy to Vercel

## Option 1: Vercel CLI (Recommended)
1. Install Vercel CLI:
   npm install -g vercel

2. Navigate to your project folder and run:
   vercel

3. Follow the prompts:
   - Login to Vercel (first time only)
   - Set up project settings
   - Deploy!

4. For production deployment:
   vercel --prod

## Option 2: Vercel Dashboard
1. Go to https://vercel.com/new
2. Click "Add GitHub Account" or import from Git
3. Select your repository
4. Configure:
   - Framework Preset: Other
   - Build Command: (leave empty for static)
   - Output Directory: ./
5. Click "Deploy"

## Option 3: Drag & Drop
1. Download your project as ZIP
2. Go to https://vercel.com/new
3. Click "Deploy" tab
4. Drag and drop your project folder
5. Click "Upload"

Your site will be live with automatic HTTPS!`
  }, [])

  const instructions = useMemo(() => 
    deployTarget === 'netlify' ? generateNetlifyInstructions() : generateVercelInstructions(),
    [deployTarget, generateNetlifyInstructions, generateVercelInstructions]
  )

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(instructions)
    alert('Instructions copied to clipboard!')
  }, [instructions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-purple-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-100">Deploy Your Website</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setDeployTarget('netlify')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                deployTarget === 'netlify'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              }`}
            >
              Netlify
            </button>
            <button
              onClick={() => setDeployTarget('vercel')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                deployTarget === 'vercel'
                  ? 'bg-gradient-to-r from-black to-gray-800 text-white shadow-lg'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              }`}
            >
              Vercel
            </button>
          </div>

          <div className="bg-[#1a1a2e] rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-200">Deployment Instructions</h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="text-sm text-purple-100 whitespace-pre-wrap font-mono overflow-x-auto">
              {instructions}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t border-purple-500/30 bg-purple-500/5">
          <p className="text-sm text-purple-300">
            💡 <strong>Tip:</strong> For the fastest deployment, use the drag-and-drop options. 
            Download your files as ZIP and upload to {deployTarget === 'netlify' ? 'Netlify Drop' : 'Vercel'}.
          </p>
        </div>
      </div>
    </div>
  )
})

DeployModal.displayName = 'DeployModal'

// Memoized Restore Work Modal
const RestoreWorkModal = memo(({ onRestore, onDiscard }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-orange-100 mb-4 flex items-center gap-2">
          <Archive className="w-6 h-6" />
          Restore Previous Work?
        </h2>
        <p className="text-orange-200 mb-6">
          We found unsaved work from your last session. Would you like to restore it?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onRestore}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Restore Work
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 py-3 px-6 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  )
})

RestoreWorkModal.displayName = 'RestoreWorkModal'

// Memoized Settings Panel
const SettingsPanel = memo(({
  showPanel,
  onClose,
  supabaseConfig,
  githubConfig,
  modelSettings,
  onSupabaseSave,
  onGithubSave,
  onModelChange,
  systemStatus,
  ollamaUrl,
  onOllamaUrlChange,
  onClearSavedWork
}) => {
  if (!showPanel) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-orange-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-orange-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-orange-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ollama Configuration */}
            <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold text-orange-100 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Ollama Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">
                    Ollama URL
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => onOllamaUrlChange(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Model Parameters */}
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Model Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Context Length: {modelSettings.numCtx}
                  </label>
                  <input
                    type="range"
                    min="2048"
                    max="32768"
                    step="2048"
                    value={modelSettings.numCtx}
                    onChange={(e) => onModelChange('numCtx', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Temperature: {modelSettings.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelSettings.temperature}
                    onChange={(e) => onModelChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Top P: {modelSettings.topP}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={modelSettings.topP}
                    onChange={(e) => onModelChange('topP', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Top K: {modelSettings.topK}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={modelSettings.topK}
                    onChange={(e) => onModelChange('topK', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Supabase Configuration */}
            <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
              <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Supabase Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Project URL
                  </label>
                  <input
                    type="text"
                    value={supabaseConfig.url}
                    onChange={(e) => supabaseConfig.setUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Anon Key
                  </label>
                  <input
                    type="password"
                    value={supabaseConfig.key}
                    onChange={(e) => supabaseConfig.setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <button
                  onClick={onSupabaseSave}
                  className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {supabaseConfig.enabled ? 'Update Settings' : 'Enable Supabase'}
                </button>
              </div>
            </div>

            {/* GitHub Configuration */}
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                <Github className="w-5 h-5" />
                GitHub Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={githubConfig.username}
                    onChange={(e) => githubConfig.setUsername(e.target.value)}
                    placeholder="your-username"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    value={githubConfig.token}
                    onChange={(e) => githubConfig.setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <button
                  onClick={onGithubSave}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {githubConfig.enabled ? 'Update Settings' : 'Enable GitHub'}
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/20">
            <h3 className="text-xl font-bold text-orange-100 mb-4">System Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.supabase ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-orange-200">Supabase: {systemStatus.supabase ? 'Connected' : 'Disabled'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.github ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-orange-200">GitHub: {systemStatus.github ? 'Connected' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Clear Saved Work */}
          <div className="mt-6 bg-gradient-to-br from-red-500/10 to-transparent rounded-xl p-6 border border-red-500/20">
            <h3 className="text-xl font-bold text-red-100 mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-red-200 mb-4 text-sm">
              Clear all auto-saved work from local storage. This cannot be undone.
            </p>
            <button
              onClick={onClearSavedWork}
              className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold transition-colors"
            >
              Clear Saved Work
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

SettingsPanel.displayName = 'SettingsPanel'

// Memoized GitHub Panel
const GithubPanel = memo(({
  showPanel,
  onClose,
  githubEnabled,
  isProcessing,
  onCreateRepo,
  onCloneRepo,
  onPushChanges,
  repoName,
  setRepoName,
  repoDescription,
  setRepoDescription,
  commitMessage,
  setCommitMessage,
  cloneUrl,
  setCloneUrl,
  uploadProgress
}) => {
  if (!showPanel) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-purple-500/30 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-purple-100 flex items-center gap-2">
            <Github className="w-6 h-6" />
            GitHub Actions
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!githubEnabled ? (
            <div className="text-center py-8">
              <Github className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200 mb-4">
                GitHub integration is not enabled. Please configure your GitHub credentials in Settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Create Repository */}
              <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-bold text-purple-100 mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Create New Repository
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="my-awesome-website"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={repoDescription}
                      onChange={(e) => setRepoDescription(e.target.value)}
                      placeholder="A beautiful website created with AI"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <button
                    onClick={onCreateRepo}
                    disabled={isProcessing || !repoName}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Repository...
                      </>
                    ) : (
                      'Create Repository'
                    )}
                  </button>
                </div>
              </div>

              {/* Clone Repository */}
              <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl p-6 border border-blue-500/20">
                <h3 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Clone Existing Repository
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={cloneUrl}
                      onChange={(e) => setCloneUrl(e.target.value)}
                      placeholder="https://github.com/username/repo.git"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-blue-500/30 rounded-lg text-blue-100 placeholder-blue-400/50 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <button
                    onClick={onCloneRepo}
                    disabled={isProcessing || !cloneUrl}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Cloning...
                      </>
                    ) : (
                      'Clone Repository'
                    )}
                  </button>
                </div>
              </div>

              {/* Push Changes */}
              <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-xl p-6 border border-green-500/20">
                <h3 className="text-xl font-bold text-green-100 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Push to GitHub
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-200 mb-2">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Update website"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-green-500/30 rounded-lg text-green-100 placeholder-green-400/50 focus:outline-none focus:border-green-500/50"
                    />
                  </div>
                  <button
                    onClick={onPushChanges}
                    disabled={isProcessing || !commitMessage}
                    className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Pushing Changes... {uploadProgress}%
                      </>
                    ) : (
                      'Push Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

GithubPanel.displayName = 'GithubPanel'

// Memoized Generation Panel with Template Grid
const GenerationPanel = memo(({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  onSelectTemplate,
  showTemplates,
  setShowTemplates
}) => {
  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const categories = {}
    Object.entries(PROMPT_TEMPLATES).forEach(([key, template]) => {
      const category = template.category || 'Other'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push({ key, ...template })
    })
    return categories
  }, [])

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-orange-500/30 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-orange-100">Generate Website</h2>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium"
        >
          {showTemplates ? 'Hide Templates' : 'Show Templates'}
        </button>
      </div>

      {showTemplates && (
        <div className="mb-4 max-h-[400px] overflow-y-auto bg-[#1a1a2e] rounded-lg p-4 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-purple-100 mb-3">Professional Templates</h3>
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 uppercase tracking-wide">
                {category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => onSelectTemplate(template.key)}
                    className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-200 rounded-lg transition-all text-left text-sm"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe the website you want to create... (or select a template above)"
        className="w-full h-48 px-4 py-3 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 resize-none focus:outline-none focus:border-orange-500/50 mb-4"
      />

      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Code className="w-5 h-5" />
            Generate Website
          </>
        )}
      </button>
    </div>
  )
})

GenerationPanel.displayName = 'GenerationPanel'

// Memoized Chat Interface
const ChatInterface = memo(({
  chatHistory,
  chatMessage,
  onChatMessageChange,
  onChatSubmit,
  isGenerating,
  hasGeneratedCode,
  onUndo,
  canUndo
}) => {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-purple-500/30 shadow-2xl p-6 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-100">Modify with Chat</h2>
        {canUndo && (
          <button
            onClick={onUndo}
            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-purple-500/20 border border-purple-500/30 text-purple-100 ml-8'
                : 'bg-orange-500/20 border border-orange-500/30 text-orange-100 mr-8'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {hasGeneratedCode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => onChatMessageChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isGenerating && chatMessage.trim() && onChatSubmit()}
            placeholder="Ask to modify the website..."
            className="flex-1 px-4 py-3 bg-[#1a1a2e] border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400/50 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={onChatSubmit}
            disabled={isGenerating || !chatMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  )
})

ChatInterface.displayName = 'ChatInterface'

// Memoized File Browser
const FileBrowser = memo(({
  files,
  selectedFile,
  onSelectFile,
  onDownloadAll,
  onDownloadZip,
  onOpenDeployModal
}) => {
  const hasFiles = files.length > 0

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-blue-500/30 shadow-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-blue-100 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Generated Files
        </h2>
        {hasFiles && (
          <div className="flex gap-2">
            <button
              onClick={onDownloadZip}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Archive className="w-4 h-4" />
              ZIP
            </button>
            <button
              onClick={onDownloadAll}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              All
            </button>
            <button
              onClick={onOpenDeployModal}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <CloudDownload className="w-4 h-4" />
              Deploy
            </button>
          </div>
        )}
      </div>

      {hasFiles ? (
        <div className="flex gap-2 flex-wrap">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => onSelectFile(file)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                selectedFile?.name === file.name
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
              }`}
            >
              <FileCode className="w-4 h-4" />
              {file.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-blue-300">
          No files generated yet. Create a website to get started!
        </div>
      )}
    </div>
  )
})

FileBrowser.displayName = 'FileBrowser'

// Memoized Preview Panel
const PreviewPanel = memo(({
  selectedFile,
  previewMode,
  onTogglePreview,
  onDownloadFile,
  iframeRef,
  shouldShowLivePreview,
  getCombinedPreviewContent
}) => {
  const previewContent = useMemo(() => {
    if (!selectedFile) return ''
    
    if (previewMode === 'live' && shouldShowLivePreview()) {
      return getCombinedPreviewContent()
    }
    
    return selectedFile.content
  }, [selectedFile, previewMode, shouldShowLivePreview, getCombinedPreviewContent])

  return (
    <div className="bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-2xl border border-green-500/30 shadow-2xl p-6 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-100 flex items-center gap-2">
          <Eye className="w-6 h-6" />
          Preview
        </h2>
        {selectedFile && (
          <div className="flex gap-2">
            <button
              onClick={onTogglePreview}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium"
            >
              {previewMode === 'auto' ? 'Auto' : previewMode === 'code' ? 'Code' : 'Live'}
            </button>
            <button
              onClick={onDownloadFile}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        )}
      </div>

      {selectedFile ? (
        <div className="flex-1 overflow-hidden rounded-lg border border-green-500/20 min-h-0">
          {(previewMode === 'live' && shouldShowLivePreview()) ? (
            <iframe
              ref={iframeRef}
              srcDoc={previewContent}
              className="w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="h-full overflow-auto p-4 bg-[#1a1a2e] text-green-100 text-sm font-mono">
              {previewContent}
            </pre>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-green-300">
          Select a file to preview
        </div>
      )}
    </div>
  )
})

PreviewPanel.displayName = 'PreviewPanel'

// Main Component
function AIWebsitePowerhouse() {
  // Core State
  const [prompt, setPrompt] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [chatMessage, setChatMessage] = useState('')
  const [codeHistory, setCodeHistory] = useState([])
  
  // UI State
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showGithubPanel, setShowGithubPanel] = useState(false)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [previewMode, setPreviewMode] = useState('auto')
  
  // Configuration State
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [supabaseEnabled, setSupabaseEnabled] = useState(false)
  const [githubUsername, setGithubUsername] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubEnabled, setGithubEnabled] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [needsBackend, _setNeedsBackend] = useState(false)
  
  // Model Parameters
  const [numCtx, setNumCtx] = useState(32768)
  const [temperature, setTemperature] = useState(0.7)
  const [topP, setTopP] = useState(0.9)
  const [topK, setTopK] = useState(40)
  
  // GitHub State
  const [isGithubProcessing, setIsGithubProcessing] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [repoDescription, setRepoDescription] = useState('')
  const [commitMessage, setCommitMessage] = useState('Update website')
  const [cloneUrl, setCloneUrl] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadProgress, _setUploadProgress] = useState(0)
  
  // Refs
  const iframeRef = useRef(null)

  // Load saved settings on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('ollamaUrl')
    const savedSupabaseUrl = localStorage.getItem('supabaseUrl')
    const savedSupabaseKey = localStorage.getItem('supabaseKey')
    const savedGithubUsername = localStorage.getItem('githubUsername')
    const savedGithubToken = localStorage.getItem('githubToken')
    
    if (savedUrl) setOllamaUrl(savedUrl)
    if (savedSupabaseUrl) setSupabaseUrl(savedSupabaseUrl)
    if (savedSupabaseKey) {
      setSupabaseKey(savedSupabaseKey)
      setSupabaseEnabled(true)
    }
    if (savedGithubUsername) setGithubUsername(savedGithubUsername)
    if (savedGithubToken) {
      setGithubToken(savedGithubToken)
      setGithubEnabled(true)
    }

    // Check for saved work
    const savedWork = localStorage.getItem('aiwebsite_autosave')
    if (savedWork) {
      setShowRestoreModal(true)
    }
  }, [])

  // Auto-save with debounce
  const saveToHistory = useMemo(
    () => debounce((files, code, chat) => {
      const workState = {
        files,
        code,
        chatHistory: chat,
        timestamp: Date.now()
      }
      localStorage.setItem('aiwebsite_autosave', JSON.stringify(workState))
    }, 2000),
    []
  )

  // Save work whenever it changes
  useEffect(() => {
    if (generatedFiles.length > 0) {
      saveToHistory(generatedFiles, generatedCode, chatHistory)
    }
  }, [generatedFiles, generatedCode, chatHistory, saveToHistory])

  // Restore saved work
  const restoreSavedWork = useCallback(() => {
    const savedWork = localStorage.getItem('aiwebsite_autosave')
    if (savedWork) {
      const { files, code, chatHistory: savedChat } = JSON.parse(savedWork)
      setGeneratedFiles(files)
      setGeneratedCode(code)
      setChatHistory(savedChat)
      setSelectedFile(files[0])
    }
    setShowRestoreModal(false)
  }, [])

  // Discard saved work
  const discardSavedWork = useCallback(() => {
    localStorage.removeItem('aiwebsite_autosave')
    setShowRestoreModal(false)
  }, [])

  // Clear saved work
  const clearSavedWork = useCallback(() => {
    if (confirm('Are you sure you want to clear all saved work? This cannot be undone.')) {
      localStorage.removeItem('aiwebsite_autosave')
      alert('Saved work cleared successfully!')
    }
  }, [])

  // Handle Ollama URL change
  const handleOllamaUrlChange = useCallback((newUrl) => {
    setOllamaUrl(newUrl)
    localStorage.setItem('ollamaUrl', newUrl)
  }, [])

  // Save Supabase settings
  const saveSupabaseSettings = useCallback(() => {
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('supabaseUrl', supabaseUrl)
      localStorage.setItem('supabaseKey', supabaseKey)
      setSupabaseEnabled(true)
      alert('Supabase settings saved!')
    } else {
      alert('Please fill in both Supabase URL and Key')
    }
  }, [supabaseUrl, supabaseKey])

  // Save GitHub settings
  const saveGithubSettings = useCallback(() => {
    if (githubUsername && githubToken) {
      localStorage.setItem('githubUsername', githubUsername)
      localStorage.setItem('githubToken', githubToken)
      setGithubEnabled(true)
      alert('GitHub settings saved!')
    } else {
      alert('Please fill in both GitHub username and token')
    }
  }, [githubUsername, githubToken])

  // Detect and split files
  const detectAndSplitFiles = useCallback((content) => {
    const files = []
    
    // Patterns to detect file markers
    const filePatterns = [
      /(?:^|\n)\/\/ File: (.+?)\n([\s\S]*?)(?=\n\/\/ File: |\n\/\* File: |$)/g,
      /(?:^|\n)\/\* File: (.+?) \*\/\n([\s\S]*?)(?=\n\/\/ File: |\n\/\* File: |$)/g,
      /(?:^|\n)<!-- File: (.+?) -->\n([\s\S]*?)(?=\n<!-- File: |\n\/\/ File: |\n\/\* File: |$)/g
    ]

    let hasFiles = false
    
    for (const pattern of filePatterns) {
      const matches = [...content.matchAll(pattern)]
      if (matches.length > 0) {
        hasFiles = true
        matches.forEach(match => {
          const filename = match[1].trim()
          const fileContent = match[2].trim()
          files.push({ name: filename, content: fileContent })
        })
        break
      }
    }

    // If no file markers found, create files based on content
    if (!hasFiles) {
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        files.push({ name: 'index.html', content: content.trim() })
      } else if (content.includes('function ') || content.includes('const ') || content.includes('import ')) {
        files.push({ name: 'script.js', content: content.trim() })
      } else if (content.includes('{') && content.includes('}')) {
        files.push({ name: 'styles.css', content: content.trim() })
      } else {
        files.push({ name: 'index.html', content: content.trim() })
      }
    }

    return files
  }, [])

  // Select template
  const handleSelectTemplate = useCallback((templateKey) => {
    const template = PROMPT_TEMPLATES[templateKey]
    setPrompt(template.prompt)
    setShowTemplates(false)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGeneratedCode('')
    setGeneratedFiles([])
    setSelectedFile(null)
    setChatHistory([])
    setCodeHistory([])

    const requiresBackend = needsBackend
    const canUseSupabase = supabaseEnabled && supabaseUrl && supabaseKey

    let systemPrompt = `You are an elite web developer with 15+ years of experience building production applications. Create a sophisticated, feature-rich, professional-grade website.

QUALITY STANDARDS:
- Think like you're building for a Fortune 500 client with a $50,000 budget
- Every feature should be polished, complete, and production-ready
- Add thoughtful UX details: loading states, animations, error handling, validation
- Include advanced features users didn't explicitly ask for but would expect
- NO shortcuts, NO placeholders, NO "TODO" comments

TECHNICAL EXCELLENCE:
- Generate ONLY valid HTML/CSS/JS code
- Use modern ES6+ JavaScript features
- Implement proper state management
- Add comprehensive error handling and user feedback
- Include accessibility features (ARIA labels, keyboard navigation)
- Make it fully responsive with mobile-first design
- Use advanced CSS (Grid, Flexbox, animations, transforms)
- Add micro-interactions and smooth transitions

FEATURE RICHNESS:
- If they ask for a portfolio, include: filtering, search, modals, lazy loading, contact form, skills visualization
- If they ask for a dashboard, include: charts, real-time updates, export features, advanced filtering, customizable widgets
- If they ask for an e-commerce site, include: cart, wishlist, product filters, reviews, size guide, related products
- Always add 2-3 features beyond what was explicitly requested
- Think: "What would make this truly impressive?"

DESIGN QUALITY:
- Use professional color schemes with proper contrast
- Implement a cohesive design system (consistent spacing, typography, shadows)
- Add glassmorphism, gradients, or modern design trends where appropriate
- Include custom icons, illustrations, or visual elements
- Make it visually stunning - this should look like it cost $10,000 to build

REAL CONTENT:
- Use REAL, contextually appropriate content - NO "Lorem Ipsum"
- Generate realistic data, names, descriptions specific to the use case
- If it's a restaurant site, include actual menu items with descriptions
- If it's a portfolio, include realistic project descriptions
- Content should feel authentic and professional

FOR MULTI-PAGE WEBSITES:
If the user requests multiple pages, separate each file clearly using this format:
<!-- FILE: filename.html -->
[complete file content here]

<!-- FILE: another-page.html -->
[complete file content here]

EXAMPLES OF GOING ABOVE AND BEYOND:
- Portfolio request → Add project filtering by category, animated hover effects, modal lightbox for images, contact form with validation, skills progress bars, testimonials section
- Landing page → Add animated hero section, stats counter, feature comparison table, FAQ accordion, newsletter signup, testimonials carousel
- Dashboard → Add multiple chart types, data export (CSV/PDF), date range picker, search/filter, dark mode toggle, notifications system
- E-commerce → Add product quick view, recently viewed items, comparison feature, size guide, color/size variations, customer reviews with photos

THINK BIGGER:
Ask yourself: "If this was my portfolio piece to show potential clients, would I be proud of it?"
Add features that demonstrate technical skill and attention to detail.`

    if (requiresBackend && canUseSupabase) {
      systemPrompt += `

SUPABASE BACKEND INTEGRATION (ENABLED):
The user has Supabase configured. Include these capabilities when relevant:

SUPABASE SETUP IN CODE:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const SUPABASE_URL = '${supabaseUrl}'
  const SUPABASE_KEY = 'YOUR_ANON_KEY_HERE'
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
</script>

AUTHENTICATION FEATURES:
- Sign up: supabase.auth.signUp({ email, password })
- Sign in: supabase.auth.signInWithPassword({ email, password })
- Sign out: supabase.auth.signOut()
- Get user: supabase.auth.getUser()

DATABASE OPERATIONS:
- Insert: supabase.from('table').insert({ data })
- Select: supabase.from('table').select('*')
- Update: supabase.from('table').update({ data }).eq('id', id)
- Delete: supabase.from('table').delete().eq('id', id)`
    } else if (requiresBackend && !canUseSupabase) {
      systemPrompt += `

BACKEND FEATURES REQUESTED (NO SUPABASE):
The user requested backend features but hasn't configured Supabase yet.
- Create a frontend-only version with localStorage for data persistence
- Add JavaScript comments noting where Supabase integration would go
- Make the app functional with localStorage as a temporary backend`
    }

    systemPrompt += `

Return ONLY the complete code. For single-page sites, start with <!DOCTYPE html>.`

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-coder:480b-cloud',
          prompt: systemPrompt + '\n\nUser request: ' + prompt,
          stream: true,
          options: {
            num_ctx: numCtx,
            temperature: Math.min(temperature * 1.3, 1.2),
            top_p: topP,
            top_k: topK,
            repeat_penalty: 1.1
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedCode = ''
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 150

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) {
              accumulatedCode += json.response
              
              const now = Date.now()
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                setGeneratedCode(accumulatedCode)
                lastUpdateTime = now
              }
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      setGeneratedCode(accumulatedCode)
      
      let cleanedCode = accumulatedCode.trim()
      const files = detectAndSplitFiles(cleanedCode)
      setGeneratedFiles(files)

      if (files.length > 0) {
        setSelectedFile(files[0])
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Error generating website: ${error.message}\n\nMake sure Ollama is running!`)
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, needsBackend, supabaseEnabled, supabaseUrl, supabaseKey, numCtx, temperature, topP, topK, detectAndSplitFiles, ollamaUrl])

  const handleChatModify = useCallback(async () => {
    if (!chatMessage.trim() || !generatedCode) return

    // Save current version to history before modifying
    setCodeHistory(prev => [...prev, {
      files: [...generatedFiles],
      code: generatedCode,
      timestamp: Date.now()
    }])

    const userMessage = { role: 'user', content: chatMessage }
    setChatHistory(prev => [...prev, userMessage])
    setChatMessage('')
    setIsGenerating(true)

    const requiresBackend = needsBackend
    const canUseSupabase = supabaseEnabled && supabaseUrl && supabaseKey

    let modifyPrompt = `You are an expert developer refining a professional website. 

CURRENT CODE:
${generatedCode}

MODIFICATION REQUEST: ${chatMessage}

QUALITY REQUIREMENTS:
- Maintain the sophisticated quality of the original
- If adding a feature, make it polished and complete with error handling
- Add complementary features that enhance the requested change
- Improve overall code quality and user experience
- Think: "How would a senior developer implement this?"
- Add smooth transitions and animations for any new UI elements
- Ensure the modification integrates seamlessly with existing design`

    if (requiresBackend && canUseSupabase) {
      modifyPrompt += `

SUPABASE IS AVAILABLE:
- URL: ${supabaseUrl}
- You can add authentication, database operations, or real-time features
- Use the Supabase JS library from CDN`
    }

    modifyPrompt += `

IMPORTANT: Return the COMPLETE modified code with ALL improvements integrated seamlessly. If there are multiple files, use the same FILE: marker format. Return ONLY the code, nothing else.`

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3-coder:480b-cloud',
          prompt: modifyPrompt,
          stream: true,
          options: {
            num_ctx: numCtx,
            temperature: Math.min(temperature * 1.3, 1.2),
            top_p: topP,
            top_k: topK,
            repeat_penalty: 1.1
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedCode = ''
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 150

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) {
              accumulatedCode += json.response
              
              const now = Date.now()
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                setGeneratedCode(accumulatedCode)
                lastUpdateTime = now
              }
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      setGeneratedCode(accumulatedCode)
      
      let cleanedCode = accumulatedCode.trim()
      const files = detectAndSplitFiles(cleanedCode)
      setGeneratedFiles(files)

      if (selectedFile) {
        const updatedFile = files.find(f => f.name === selectedFile.name)
        setSelectedFile(updatedFile || files[0])
      }

      const assistantMessage = { role: 'assistant', content: 'Website updated successfully!' }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Modification error:', error)
      const errorMessage = { role: 'assistant', content: `Error: ${error.message}` }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }, [chatMessage, generatedCode, generatedFiles, needsBackend, supabaseEnabled, supabaseUrl, supabaseKey, numCtx, temperature, topP, topK, detectAndSplitFiles, selectedFile, ollamaUrl])

  // Undo last change
  const undoLastChange = useCallback(() => {
    if (codeHistory.length === 0) return

    const previousState = codeHistory[codeHistory.length - 1]
    setGeneratedCode(previousState.code)
    setGeneratedFiles(previousState.files)
    setSelectedFile(previousState.files[0])
    setCodeHistory(prev => prev.slice(0, -1))
    
    const undoMessage = { role: 'assistant', content: 'Reverted to previous version' }
    setChatHistory(prev => [...prev, undoMessage])
  }, [codeHistory])

  // Download single file
  const downloadFile = useCallback((file) => {
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Download all files
  const downloadAllFiles = useCallback(() => {
    generatedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 100)
    })
  }, [generatedFiles, downloadFile])

  // Download as ZIP
  const downloadAsZip = useCallback(async () => {
    try {
      // Dynamic import of JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      generatedFiles.forEach(file => {
        zip.file(file.name, file.content)
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'website.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('ZIP creation error:', error)
      alert('Error creating ZIP file. Downloading files individually instead.')
      downloadAllFiles()
    }
  }, [generatedFiles, downloadAllFiles])

  // GitHub functions
  const createGithubRepo = useCallback(async () => {
    if (!repoName || !githubEnabled) return

    setIsGithubProcessing(true)
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          auto_init: true
        })
      })

      if (!response.ok) throw new Error('Failed to create repository')

      const data = await response.json()
      alert(`Repository created: ${data.html_url}`)
      setRepoName('')
      setRepoDescription('')
    } catch (error) {
      console.error('GitHub error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsGithubProcessing(false)
    }
  }, [repoName, repoDescription, githubToken, githubEnabled])

  const cloneGithubRepo = useCallback(async () => {
    alert('Clone functionality requires server-side implementation')
  }, [])

  const pushToGithub = useCallback(async () => {
    alert('Push functionality requires server-side implementation')
  }, [])

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setPreviewMode(prev => {
      if (prev === 'auto') return 'code'
      if (prev === 'code') return 'live'
      return 'auto'
    })
  }, [])

  // Check if should show live preview
  const shouldShowLivePreview = useCallback(() => {
    if (previewMode === 'code') return false
    if (previewMode === 'live') return true
    return selectedFile?.name.endsWith('.html')
  }, [previewMode, selectedFile])

  // Get combined preview content
  const getCombinedPreviewContent = useCallback(() => {
    const htmlFile = generatedFiles.find(f => f.name.endsWith('.html'))
    if (!htmlFile) return selectedFile?.content || ''

    let content = htmlFile.content

    // Inject CSS
    const cssFile = generatedFiles.find(f => f.name.endsWith('.css'))
    if (cssFile) {
      content = content.replace('</head>', `<style>${cssFile.content}</style></head>`)
    }

    // Inject JS
    const jsFile = generatedFiles.find(f => f.name.endsWith('.js'))
    if (jsFile) {
      content = content.replace('</body>', `<script>${jsFile.content}</script></body>`)
    }

    return content
  }, [generatedFiles, selectedFile])

  // Memoized values
  const hasGeneratedCode = useMemo(() => generatedCode.length > 0, [generatedCode])
  const systemStatus = useMemo(() => ({
    supabase: supabaseEnabled,
    github: githubEnabled
  }), [supabaseEnabled, githubEnabled])
  const canUndo = useMemo(() => codeHistory.length > 0, [codeHistory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] text-gray-900">
      {/* Restore Work Modal */}
      {showRestoreModal && (
        <RestoreWorkModal
          onRestore={restoreSavedWork}
          onDiscard={discardSavedWork}
        />
      )}

      {/* Deploy Modal */}
      <DeployModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-[#ff6b35]/20 to-[#f7931e]/20 backdrop-blur-sm border-b border-orange-500/20">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931e] bg-clip-text text-transparent">
              AI Website Powerhouse
            </h1>
            {supabaseEnabled && (
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300 text-sm font-medium flex items-center gap-1">
                <Database className="w-3 h-3" />
                Full-Stack
              </span>
            )}
            {githubEnabled && (
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium flex items-center gap-1">
                <Github className="w-3 h-3" />
                GitHub
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {githubEnabled && (
              <button
                onClick={() => setShowGithubPanel(!showGithubPanel)}
                className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                title="GitHub Actions"
              >
                <Github className="w-6 h-6 text-purple-300" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
            >
              <Settings className="w-6 h-6 text-orange-300" />
            </button>
          </div>
        </div>
      </header>

      {/* GitHub Panel */}
      <GithubPanel
        showPanel={showGithubPanel}
        onClose={() => setShowGithubPanel(false)}
        githubEnabled={githubEnabled}
        isProcessing={isGithubProcessing}
        onCreateRepo={createGithubRepo}
        onCloneRepo={cloneGithubRepo}
        onPushChanges={pushToGithub}
        repoName={repoName}
        setRepoName={setRepoName}
        repoDescription={repoDescription}
        setRepoDescription={setRepoDescription}
        commitMessage={commitMessage}
        setCommitMessage={setCommitMessage}
        cloneUrl={cloneUrl}
        setCloneUrl={setCloneUrl}
        uploadProgress={uploadProgress}
      />

      {/* Settings Panel */}
      <SettingsPanel
        showPanel={showSettings}
        onClose={() => setShowSettings(false)}
        supabaseConfig={{
          url: supabaseUrl,
          key: supabaseKey,
          enabled: supabaseEnabled,
          setUrl: setSupabaseUrl,
          setKey: setSupabaseKey
        }}
        githubConfig={{
          username: githubUsername,
          token: githubToken,
          enabled: githubEnabled,
          setUsername: setGithubUsername,
          setToken: setGithubToken
        }}
        modelSettings={{
          numCtx,
          temperature,
          topP,
          topK
        }}
        onSupabaseSave={saveSupabaseSettings}
        onGithubSave={saveGithubSettings}
        onModelChange={(key, value) => {
          switch(key) {
            case 'numCtx': setNumCtx(value); break
            case 'temperature': setTemperature(value); break
            case 'topP': setTopP(value); break
            case 'topK': setTopK(value); break
          }
        }}
        systemStatus={systemStatus}
        ollamaUrl={ollamaUrl}
        onOllamaUrlChange={handleOllamaUrlChange}
        onClearSavedWork={clearSavedWork}
      />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

          <div className="lg:col-span-4 flex flex-col gap-6">
            <GenerationPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onSelectTemplate={handleSelectTemplate}
              showTemplates={showTemplates}
              setShowTemplates={setShowTemplates}
            />

            <ChatInterface
              chatHistory={chatHistory}
              chatMessage={chatMessage}
              onChatMessageChange={setChatMessage}
              onChatSubmit={handleChatModify}
              isGenerating={isGenerating}
              hasGeneratedCode={hasGeneratedCode}
              onUndo={undoLastChange}
              canUndo={canUndo}
            />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4">
            <FileBrowser
              files={generatedFiles}
              selectedFile={selectedFile}
              onSelectFile={setSelectedFile}
              onDownloadAll={downloadAllFiles}
              onDownloadZip={downloadAsZip}
              onOpenDeployModal={() => setShowDeployModal(true)}
            />

            <PreviewPanel
              selectedFile={selectedFile}
              previewMode={previewMode}
              onTogglePreview={togglePreviewMode}
              onDownloadFile={() => downloadFile(selectedFile)}
              iframeRef={iframeRef}
              shouldShowLivePreview={shouldShowLivePreview}
              getCombinedPreviewContent={getCombinedPreviewContent}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export wrapped in error boundary
export default function AIWebsitePowerhouseWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AIWebsitePowerhouse />
    </ErrorBoundary>
  )
}
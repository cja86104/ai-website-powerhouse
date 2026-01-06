# 🚀 AI Website Powerhouse

**Generate complete, professional websites using local AI models with Ollama.**

A powerful, privacy-focused web application that leverages local Large Language Models to create stunning, production-ready websites through natural language prompts. No API keys required, no data leaves your machine.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB)
![Ollama](https://img.shields.io/badge/Ollama-Compatible-green)

---

## ✨ Features

### 🤖 AI-Powered Generation
- **Natural Language Input** - Describe your website in plain English and watch it come to life
- **20 Professional Templates** - Pre-built prompts for SaaS landing pages, portfolios, e-commerce, restaurants, law firms, medical clinics, and more
- **Intelligent Code Splitting** - Automatically separates HTML, CSS, and JavaScript into organized files
- **Iterative Refinement** - Chat-based modification system to refine your website through conversation

### 🔒 Privacy First
- **100% Local Processing** - All AI inference runs on your machine via Ollama
- **No Data Collection** - Your prompts and generated code never leave your computer
- **No API Keys Required** - No OpenAI, Anthropic, or cloud AI subscriptions needed

### 💻 Developer Experience
- **Live Preview** - Real-time preview of generated websites with hot reload
- **Code Editor View** - Syntax-highlighted code display with file browser
- **Multi-File Support** - Handles complex projects with multiple HTML, CSS, and JS files
- **Download Options** - Export as individual files or bundled ZIP archive
- **Undo Support** - Revert changes with built-in history

### 🔧 Integrations
- **GitHub Integration** - Create repositories directly from the app
- **Supabase Ready** - Optional backend integration for dynamic features
- **One-Click Deploy** - Deployment instructions for Netlify and Vercel

### 🎨 Quality Output
- **Production-Ready Code** - Clean, semantic HTML with modern CSS
- **Responsive Design** - Mobile-first layouts that work on all devices
- **Modern Aesthetics** - Gradients, animations, glassmorphism, and contemporary design patterns

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **Ollama** | Latest | [ollama.ai](https://ollama.ai/) |
| **AI Model** | Any coding model | See below |

### Recommended Ollama Models

```bash
# Best quality (requires powerful GPU)
ollama pull qwen2.5-coder:32b

# Good balance of speed/quality
ollama pull qwen2.5-coder:14b

# Fast, lower resource usage
ollama pull qwen2.5-coder:7b

# Alternative options
ollama pull codellama:13b
ollama pull deepseek-coder:6.7b
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https:cja86104@github.com/ai-website-powerhouse
cd ai-website-powerhouse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Ollama

Make sure Ollama is running with your preferred model:

```bash
# Start Ollama service (if not already running)
ollama serve

# In another terminal, verify your model is available
ollama list
```

### 4. Launch the Application

```bash
npm run dev
```

### 5. Open in Browser

Navigate to [http://localhost:4000](http://localhost:4000)

---

## 📖 Usage Guide

### Basic Website Generation

1. **Enter a Prompt** - Describe the website you want in the left panel
   ```
   Create a modern portfolio website for a photographer with a 
   dark theme, image gallery, about section, and contact form
   ```

2. **Click Generate** - Wait for the AI to create your website (typically 30-90 seconds)

3. **Preview & Refine** - View the live preview on the right, use chat to make changes
   ```
   Make the gallery images larger and add a lightbox effect
   ```

4. **Download** - Export as ZIP or individual files

### Using Templates

Click the **Templates** button to access 20 pre-built prompts organized by category:

| Category | Templates |
|----------|-----------|
| **Business** | SaaS Landing Page, Creative Agency, Restaurant |
| **E-commerce** | Fashion Store, Product Launch |
| **Professional** | Law Firm, Medical Clinic, Real Estate |
| **Creative** | Photography Portfolio, Music Artist, Podcast |
| **Personal** | Developer Portfolio, Resume/CV, Wedding |
| **Community** | Non-Profit, Event/Conference, Online Course |

### Chat Modifications

After generating a website, use the chat interface to make iterative changes:

- "Add a newsletter signup form in the footer"
- "Change the color scheme to blue and white"
- "Make the navigation sticky"
- "Add smooth scroll animations"
- "Include a testimonials section with 3 cards"

### Configuration

Click the **⚙️ Settings** button to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Ollama URL** | Your Ollama server address | `http://localhost:11434` |
| **Context Size** | Token context window | `32768` |
| **Temperature** | Creativity level (0-1) | `0.7` |
| **Top P** | Nucleus sampling | `0.9` |
| **Top K** | Token selection pool | `40` |

---

## 🔌 Optional Integrations

### GitHub Integration

1. Generate a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope
2. Enter your GitHub username and token in Settings
3. Create repositories directly from the app

### Supabase Integration

For dynamic backend features (authentication, database, etc.):

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your Project URL and Anon Key
3. Enter credentials in Settings
4. The AI will automatically include Supabase integration when needed

---

## 🛠️ Development

### Project Structure

```
ai-website-powerhouse/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page
├── components/
│   └── AIWebsitePowerhouse.js  # Main application component
├── public/              # Static assets
├── package.json
└── README.md
```

### Available Scripts

```bash
# Development server (port 4000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Tech Stack

- **Framework**: Next.js 16.1.1
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **Bundling**: JSZip (for downloads)
- **AI Backend**: Ollama (local)

---

## 🌐 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-website-powerhouse)

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/ai-website-powerhouse)

> **Note**: The deployed app will still require users to run Ollama locally or provide a remote Ollama URL.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-website-powerhouse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-website-powerhouse/discussions)

---

<p align="center">
  Made with ❤️ by developers, for developers
</p>

<p align="center">
  <a href="#-ai-website-powerhouse">Back to Top ↑</a>
</p>

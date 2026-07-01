'use client'

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Send, Loader2, Download,
  X, Github, Sliders, Database, GitBranch, Upload,
  Archive, Trash2, Undo,
  Cloud
} from 'lucide-react'
import {
  CURATED_OPENROUTER_MODELS,
  CUSTOM_MODEL_ID,
  DEFAULT_OLLAMA_MODEL_ID,
  PRICE_LIST_VERIFIED_AT,
  formatDropdownLabel,
} from '@/lib/models'
import { generateStream } from '@/lib/llm'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { HydrationGate } from '@/components/shared/HydrationGate'
import { Header } from '@/components/layout/Header'
import { GenerationPanel } from '@/components/generation/GenerationPanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { FileBrowser } from '@/components/files/FileBrowser'
import { debounce } from '@/lib/utils/debounce'
import { parseGeneratedFiles } from '@/lib/generation/parser'
import { buildSystemPrompt } from '@/lib/prompts/system-prompt'
import { buildModifyPrompt } from '@/lib/prompts/modify-prompt'
import { useSettingsStore } from '@/lib/store/settings-store'
import { useIntegrationsStore } from '@/lib/store/integrations-store'
import { useGenerationStore } from '@/lib/store/generation-store'
import { useChatStore } from '@/lib/store/chat-store'
import { useUiStore } from '@/lib/store/ui-store'
import { saveSnapshot, loadSnapshot, clearSnapshot, hasSnapshot } from '@/lib/store/autosave'

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
  onClearSavedWork,
  aiProvider,
  onAiProviderChange,
  openrouterConfig,
  onOpenrouterSave
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
          {/* AI Provider Toggle */}
          <div className="mb-6 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl p-6 border border-cyan-500/20">
            <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              AI Provider
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => onAiProviderChange('ollama')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  aiProvider === 'ollama'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                }`}
              >
                Local (Ollama)
              </button>
              <button
                onClick={() => onAiProviderChange('openrouter')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  aiProvider === 'openrouter'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20'
                }`}
              >
                Cloud (OpenRouter)
              </button>
            </div>
            <p className="text-sm text-cyan-300/70 mt-3">
              {aiProvider === 'ollama'
                ? 'Generation uses your local Ollama server (configured below).'
                : 'Generation uses OpenRouter cloud models (configured below).'}
            </p>
          </div>

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
                <div>
                  <label className="block text-sm font-medium text-orange-200 mb-2">
                    Model
                  </label>
                  {availableModels.length > 0 ? (
                    <select
                      value={selectedModel}
                      onChange={(e) => onSelectedModelChange(e.target.value)}
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 focus:outline-none focus:border-orange-500/50"
                    >
                      {!availableModels.includes(selectedModel) && (
                        <option value={selectedModel}>{selectedModel}</option>
                      )}
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedModel}
                      onChange={(e) => onSelectedModelChange(e.target.value)}
                      placeholder="qwen2.5-coder:14b"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-orange-500/30 rounded-lg text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-500/50"
                    />
                  )}
                  <p className="text-xs text-orange-400/70 mt-1">
                    {availableModels.length > 0 
                      ? `${availableModels.length} model(s) available` 
                      : 'Enter model name or connect to Ollama to see available models'}
                  </p>
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

            {/* OpenRouter Configuration */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl p-6 border border-cyan-500/20">
              <h3 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                OpenRouter Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    API Key
                    {openrouterConfig.serverAvailable !== null && (
                      <span className="ml-2 text-xs text-cyan-300/60">
                        {openrouterConfig.serverAvailable
                          ? '(leave blank to use server key)'
                          : '(server key not configured)'}
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={openrouterConfig.apiKey}
                    onChange={(e) => openrouterConfig.setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-400/50 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    Model
                  </label>
                  <select
                    value={openrouterConfig.model}
                    onChange={(e) => openrouterConfig.setModel(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                  >
                    {CURATED_OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {formatDropdownLabel(m)}
                      </option>
                    ))}
                    <option value={CUSTOM_MODEL_ID}>
                      Custom… (enter slug below)
                    </option>
                  </select>
                  <p className="text-xs text-cyan-300/60 mt-1">
                    Prices verified {PRICE_LIST_VERIFIED_AT}.
                  </p>
                </div>
                {openrouterConfig.model === CUSTOM_MODEL_ID && (
                  <div>
                    <label className="block text-sm font-medium text-cyan-200 mb-2">
                      Custom Model Slug
                    </label>
                    <input
                      type="text"
                      value={openrouterConfig.customSlug}
                      onChange={(e) => openrouterConfig.setCustomSlug(e.target.value)}
                      placeholder="provider/model-name"
                      className="w-full px-4 py-2 bg-[#1a1a2e] border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-400/50 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">
                    Max Output Tokens: {openrouterConfig.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="1024"
                    max="64000"
                    step="512"
                    value={openrouterConfig.maxTokens}
                    onChange={(e) => openrouterConfig.setMaxTokens(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={onOpenrouterSave}
                  className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Save OpenRouter Settings
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/20">
            <h3 className="text-xl font-bold text-orange-100 mb-4">System Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.aiProvider === 'ollama' ? 'bg-orange-500' : 'bg-cyan-500'}`}></div>
                <span className="text-orange-200">Active Provider: {systemStatus.aiProvider === 'ollama' ? 'Ollama (local)' : 'OpenRouter (cloud)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.openrouterServerAvailable === true
                    ? 'bg-green-500'
                    : systemStatus.openrouterServerAvailable === false
                    ? 'bg-gray-500'
                    : 'bg-yellow-500'
                }`}></div>
                <span className="text-orange-200">OR Server Key: {
                  systemStatus.openrouterServerAvailable === true
                    ? 'Available'
                    : systemStatus.openrouterServerAvailable === false
                    ? 'Not configured'
                    : 'Checking…'
                }</span>
              </div>
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
  setCloneUrl
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
                        Pushing Changes...
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

// GenerationPanel extracted in W1 PR-3 -> components/generation/GenerationPanel.tsx

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
            data-shortcut="undo"
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

// FileBrowser extracted in W1 PR-3 -> components/files/FileBrowser.tsx

// PreviewPanel extracted in W1 PR-3 -> components/preview/PreviewPanel.tsx

// Main Component
function AIWebsitePowerhouse() {
  // Generation Store — `prompt` is read for the generate call; the write
  // side (`setPrompt`) moved into PromptForm/TemplatePicker with PR-3.
  const prompt = useGenerationStore((s) => s.prompt)
  const generatedCode = useGenerationStore((s) => s.generatedCode)
  const setGeneratedCode = useGenerationStore((s) => s.setGeneratedCode)
  const generatedFiles = useGenerationStore((s) => s.generatedFiles)
  const setGeneratedFiles = useGenerationStore((s) => s.setGeneratedFiles)
  const selectedFile = useGenerationStore((s) => s.selectedFile)
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile)
  const isGenerating = useGenerationStore((s) => s.isGenerating)
  const setIsGenerating = useGenerationStore((s) => s.setIsGenerating)
  const codeHistory = useGenerationStore((s) => s.codeHistory)
  const setCodeHistory = useGenerationStore((s) => s.setCodeHistory)
  const setGenerationStats = useGenerationStore((s) => s.setGenerationStats)

  // Chat Store
  const chatHistory = useChatStore((s) => s.chatHistory)
  const setChatHistory = useChatStore((s) => s.setChatHistory)
  const chatMessage = useChatStore((s) => s.chatMessage)
  const setChatMessage = useChatStore((s) => s.setChatMessage)

  // Templates Store — no selectors needed on the main component in
  // PR-3 (all user-template read/write moved into TemplatePicker /
  // PromptForm). Kept in dependency graph via those subcomponents.

  // UI Store — modals/panels + preview mode
  const showSettings = useUiStore((s) => s.showSettings)
  const setShowSettings = useUiStore((s) => s.setShowSettings)
  const showGithubPanel = useUiStore((s) => s.showGithubPanel)
  const setShowGithubPanel = useUiStore((s) => s.setShowGithubPanel)
  const showDeployModal = useUiStore((s) => s.showDeployModal)
  const setShowDeployModal = useUiStore((s) => s.setShowDeployModal)
  const showRestoreModal = useUiStore((s) => s.showRestoreModal)
  const setShowRestoreModal = useUiStore((s) => s.setShowRestoreModal)

  // UI Store — OpenRouter availability probe
  const openrouterServerAvailable = useUiStore((s) => s.openrouterServerAvailable)
  const setOpenrouterServerAvailable = useUiStore((s) => s.setOpenrouterServerAvailable)

  // UI Store — GitHub form state
  const isGithubProcessing = useUiStore((s) => s.isGithubProcessing)
  const setIsGithubProcessing = useUiStore((s) => s.setIsGithubProcessing)
  const repoName = useUiStore((s) => s.repoName)
  const setRepoName = useUiStore((s) => s.setRepoName)
  const repoDescription = useUiStore((s) => s.repoDescription)
  const setRepoDescription = useUiStore((s) => s.setRepoDescription)
  const commitMessage = useUiStore((s) => s.commitMessage)
  const setCommitMessage = useUiStore((s) => s.setCommitMessage)
  const cloneUrl = useUiStore((s) => s.cloneUrl)
  const setCloneUrl = useUiStore((s) => s.setCloneUrl)

  // Settings Store
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl)
  const setOllamaUrl = useSettingsStore((s) => s.setOllamaUrl)
  const aiProvider = useSettingsStore((s) => s.aiProvider)
  const setAiProvider = useSettingsStore((s) => s.setAiProvider)
  const openrouterKey = useSettingsStore((s) => s.openrouterKey)
  const setOpenrouterKey = useSettingsStore((s) => s.setOpenrouterKey)
  const openrouterModel = useSettingsStore((s) => s.openrouterModel)
  const setOpenrouterModel = useSettingsStore((s) => s.setOpenrouterModel)
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug)
  const setOpenrouterCustomSlug = useSettingsStore((s) => s.setOpenrouterCustomSlug)
  const openrouterMaxTokens = useSettingsStore((s) => s.openrouterMaxTokens)
  const setOpenrouterMaxTokens = useSettingsStore((s) => s.setOpenrouterMaxTokens)
  const numCtx = useSettingsStore((s) => s.numCtx)
  const setNumCtx = useSettingsStore((s) => s.setNumCtx)
  const temperature = useSettingsStore((s) => s.temperature)
  const setTemperature = useSettingsStore((s) => s.setTemperature)
  const topP = useSettingsStore((s) => s.topP)
  const setTopP = useSettingsStore((s) => s.setTopP)
  const topK = useSettingsStore((s) => s.topK)
  const setTopK = useSettingsStore((s) => s.setTopK)

  // Integrations Store
  const supabaseUrl = useIntegrationsStore((s) => s.supabaseUrl)
  const setSupabaseUrl = useIntegrationsStore((s) => s.setSupabaseUrl)
  const supabaseKey = useIntegrationsStore((s) => s.supabaseKey)
  const setSupabaseKey = useIntegrationsStore((s) => s.setSupabaseKey)
  const supabaseEnabled = useIntegrationsStore((s) => s.supabaseEnabled)
  const setSupabaseEnabled = useIntegrationsStore((s) => s.setSupabaseEnabled)
  const githubUsername = useIntegrationsStore((s) => s.githubUsername)
  const setGithubUsername = useIntegrationsStore((s) => s.setGithubUsername)
  const githubToken = useIntegrationsStore((s) => s.githubToken)
  const setGithubToken = useIntegrationsStore((s) => s.setGithubToken)
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled)
  const setGithubEnabled = useIntegrationsStore((s) => s.setGithubEnabled)

  // Refs — iframeRef moved into PreviewPanel in W1 PR-3.

  // Connectivity probe for Ollama. The model-picker UI was unwired during the
  // OpenRouter restructure; this preserves a no-op network check (and the
  // hook-dep stability that handleOllamaUrlChange + the init useEffect rely
  // on) until the model picker is rebuilt in the W5 generation refactor.
  const fetchAvailableModels = useCallback(async (url) => {
    try {
      await fetch(`${url}/api/tags`)
    } catch (error) {
      console.log('Could not reach Ollama:', error.message)
    }
  }, [])

  // Mount-time bootstrap: hydration of persisted settings is handled by
  // <HydrationGate>, so by the time this effect runs every persisted
  // value (ollamaUrl, openrouterKey, etc.) is already on the store.
  // What's left to do at mount:
  //  1. Probe Ollama connectivity (best-effort; preserves the no-op
  //     network ping the legacy code did so server-side issues surface
  //     in DevTools).
  //  2. Probe the /api/openrouter availability endpoint.
  //  3. Surface the RestoreWorkModal if an autosave snapshot exists.
  //
  // The intentionally empty dep array runs this once per mount. We
  // intentionally do NOT depend on `ollamaUrl` — re-running this on
  // URL change would re-probe and double-prompt restore.
  useEffect(() => {
    fetchAvailableModels(ollamaUrl)

    // Probe server-side OpenRouter availability (best-effort)
    fetch('/api/openrouter', { method: 'GET' })
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((data) => setOpenrouterServerAvailable(Boolean(data && data.available)))
      .catch(() => setOpenrouterServerAvailable(false))

    if (hasSnapshot()) {
      setShowRestoreModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAvailableModels])

  // Auto-save with debounce
  const saveToHistory = useMemo(
    () => debounce((files, code, chat) => {
      saveSnapshot(files, code, chat)
    }, 2000),
    []
  )

  // Save work whenever it changes
  useEffect(() => {
    if (generatedFiles.length > 0) {
      saveToHistory(generatedFiles, generatedCode, chatHistory)
    }
  }, [generatedFiles, generatedCode, chatHistory, saveToHistory])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter: Generate website
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        // Trigger generate button click if conditions are met
        const generateBtn = document.querySelector('[data-shortcut="generate"]')
        if (generateBtn && !generateBtn.disabled) {
          generateBtn.click()
        }
      }
      
      // Ctrl+S or Cmd+S: Download as ZIP
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const zipBtn = document.querySelector('[data-shortcut="download-zip"]')
        if (zipBtn && !zipBtn.disabled) {
          zipBtn.click()
        }
      }
      
      // Ctrl+Z or Cmd+Z: Undo (only when not in input/textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const activeEl = document.activeElement
        const isInInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'
        if (!isInInput) {
          e.preventDefault()
          const undoBtn = document.querySelector('[data-shortcut="undo"]')
          if (undoBtn && !undoBtn.disabled) {
            undoBtn.click()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Restore saved work
  const restoreSavedWork = useCallback(() => {
    const snapshot = loadSnapshot()
    if (snapshot) {
      setGeneratedFiles(snapshot.files)
      setGeneratedCode(snapshot.code)
      setChatHistory(snapshot.chatHistory)
      setSelectedFile(snapshot.files[0] || null)
    }
    setShowRestoreModal(false)
  }, [setGeneratedFiles, setGeneratedCode, setChatHistory, setSelectedFile, setShowRestoreModal])

  // Discard saved work
  const discardSavedWork = useCallback(() => {
    clearSnapshot()
    setShowRestoreModal(false)
  }, [setShowRestoreModal])

  // Clear saved work
  const clearSavedWork = useCallback(() => {
    if (confirm('Are you sure you want to clear all saved work? This cannot be undone.')) {
      clearSnapshot()
      alert('Saved work cleared successfully!')
    }
  }, [])

  // Handle Ollama URL change. The store setter handles persistence;
  // we still need to re-probe the new URL for connectivity.
  const handleOllamaUrlChange = useCallback((newUrl) => {
    setOllamaUrl(newUrl)
    fetchAvailableModels(newUrl)
  }, [setOllamaUrl, fetchAvailableModels])

  // Save Supabase settings. The URL/key are already persisted via the
  // Zustand store's onChange — this callback only flips the `enabled`
  // flag and shows the confirmation, matching legacy "Save" semantics.
  const saveSupabaseSettings = useCallback(() => {
    if (supabaseUrl && supabaseKey) {
      setSupabaseEnabled(true)
      alert('Supabase settings saved!')
    } else {
      alert('Please fill in both Supabase URL and Key')
    }
  }, [supabaseUrl, supabaseKey, setSupabaseEnabled])

  // Save GitHub settings. Same pattern as Supabase: the credentials
  // already persisted on change; this only flips the `enabled` flag.
  const saveGithubSettings = useCallback(() => {
    if (githubUsername && githubToken) {
      setGithubEnabled(true)
      alert('GitHub settings saved!')
    } else {
      alert('Please fill in both GitHub username and token')
    }
  }, [githubUsername, githubToken, setGithubEnabled])

  // Handle AI provider change
  const handleAiProviderChange = useCallback((newProvider) => {
    setAiProvider(newProvider)
  }, [setAiProvider])

  // Save OpenRouter settings — settings already persisted via the
  // store's onChange; this callback is now only the confirmation alert.
  const saveOpenrouterSettings = useCallback(() => {
    alert('OpenRouter settings saved!')
  }, [])

  // Template select/save/delete callbacks moved into TemplatePicker
  // and PromptForm in W1 PR-3 (components/generation/).

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGeneratedCode('')
    setGeneratedFiles([])
    setSelectedFile(null)
    setChatHistory([])
    setCodeHistory([])
    setGenerationStats(null)

    // `needsBackend` state was audit-flagged as dead (setter never
    // called) and deleted in W1 PR-2. Hard-coded false here pending
    // the prompt-builder dead-branch cleanup in W1 PR-5.
    const requiresBackend = false
    const canUseSupabase = supabaseEnabled && supabaseUrl && supabaseKey

    const systemPrompt = buildSystemPrompt({
      requiresBackend,
      canUseSupabase,
      supabaseUrl,
    })

    // Resolve the effective OpenRouter model. The CUSTOM_MODEL_ID sentinel
    // means the user picked "Custom…" in the dropdown and typed their own slug.
    const effectiveOrModel =
      openrouterModel === CUSTOM_MODEL_ID
        ? openrouterCustomSlug.trim()
        : openrouterModel

    let lastUpdateTime = Date.now()
    const UPDATE_INTERVAL = 150
    let capturedError = null

    try {
      await generateStream({
        provider: aiProvider,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        ollamaConfig: {
          url: ollamaUrl,
          model: DEFAULT_OLLAMA_MODEL_ID,
          num_ctx: numCtx,
          temperature: Math.min(temperature * 1.3, 1.2),
          top_p: topP,
          top_k: topK,
          repeat_penalty: 1.1,
        },
        openrouterConfig: {
          apiKey: openrouterKey.trim() || null,
          model: effectiveOrModel,
          temperature: Math.min(temperature * 1.3, 1.2),
          top_p: topP,
          max_tokens: openrouterMaxTokens,
        },
        onChunk: (_fragment, accumulated) => {
          const now = Date.now()
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            setGeneratedCode(accumulated)
            lastUpdateTime = now
          }
        },
        onDone: (fullText) => {
          setGeneratedCode(fullText)
          const cleanedCode = fullText.trim()
          const files = parseGeneratedFiles(cleanedCode)
          setGeneratedFiles(files)
          if (files.length > 0) {
            setSelectedFile(files[0])
          }
        },
        onError: (err) => {
          capturedError = err
        },
      })

      if (capturedError) {
        throw capturedError
      }
    } catch (error) {
      console.error('Generation error:', error)
      const providerLabel = aiProvider === 'ollama' ? 'Ollama' : 'OpenRouter'
      const hint =
        aiProvider === 'ollama'
          ? 'Make sure Ollama is running!'
          : 'Check your OpenRouter API key and selected model in Settings.'
      alert(`Error generating website (${providerLabel}): ${error.message}\n\n${hint}`)
    } finally {
      setIsGenerating(false)
    }
  }, [
    prompt,
    supabaseEnabled,
    supabaseUrl,
    supabaseKey,
    numCtx,
    temperature,
    topP,
    topK,
    ollamaUrl,
    aiProvider,
    openrouterKey,
    openrouterModel,
    openrouterCustomSlug,
    openrouterMaxTokens,
    setIsGenerating,
    setGeneratedCode,
    setGeneratedFiles,
    setSelectedFile,
    setChatHistory,
    setCodeHistory,
    setGenerationStats,
  ])

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

    // `needsBackend` state was audit-flagged as dead (setter never
    // called) and deleted in W1 PR-2. Hard-coded false here pending
    // the prompt-builder dead-branch cleanup in W1 PR-5.
    const requiresBackend = false
    const canUseSupabase = supabaseEnabled && supabaseUrl && supabaseKey

    const modifyPrompt = buildModifyPrompt({
      generatedCode,
      chatMessage,
      requiresBackend,
      canUseSupabase,
      supabaseUrl,
    })

    // Resolve the effective OpenRouter model. Same rule as handleGenerate.
    const effectiveOrModel =
      openrouterModel === CUSTOM_MODEL_ID
        ? openrouterCustomSlug.trim()
        : openrouterModel

    let lastUpdateTime = Date.now()
    const UPDATE_INTERVAL = 150
    let capturedError = null

    try {
      await generateStream({
        provider: aiProvider,
        messages: [{ role: 'user', content: modifyPrompt }],
        ollamaConfig: {
          url: ollamaUrl,
          model: DEFAULT_OLLAMA_MODEL_ID,
          num_ctx: numCtx,
          temperature: Math.min(temperature * 1.3, 1.2),
          top_p: topP,
          top_k: topK,
          repeat_penalty: 1.1,
        },
        openrouterConfig: {
          apiKey: openrouterKey.trim() || null,
          model: effectiveOrModel,
          temperature: Math.min(temperature * 1.3, 1.2),
          top_p: topP,
          max_tokens: openrouterMaxTokens,
        },
        onChunk: (_fragment, accumulated) => {
          const now = Date.now()
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            setGeneratedCode(accumulated)
            lastUpdateTime = now
          }
        },
        onDone: (fullText) => {
          setGeneratedCode(fullText)
          const cleanedCode = fullText.trim()
          const files = parseGeneratedFiles(cleanedCode)
          setGeneratedFiles(files)
          if (selectedFile) {
            const updatedFile = files.find((f) => f.name === selectedFile.name)
            setSelectedFile(updatedFile || files[0])
          }
          const assistantMessage = {
            role: 'assistant',
            content: 'Website updated successfully!',
          }
          setChatHistory((prev) => [...prev, assistantMessage])
        },
        onError: (err) => {
          capturedError = err
        },
      })

      if (capturedError) {
        throw capturedError
      }
    } catch (error) {
      console.error('Modification error:', error)
      const errorMessage = { role: 'assistant', content: `Error: ${error.message}` }
      setChatHistory((prev) => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }, [
    chatMessage,
    generatedCode,
    generatedFiles,
    supabaseEnabled,
    supabaseUrl,
    supabaseKey,
    numCtx,
    temperature,
    topP,
    topK,
    selectedFile,
    ollamaUrl,
    aiProvider,
    openrouterKey,
    openrouterModel,
    openrouterCustomSlug,
    openrouterMaxTokens,
    setIsGenerating,
    setGeneratedCode,
    setGeneratedFiles,
    setSelectedFile,
    setChatHistory,
    setChatMessage,
    setCodeHistory,
  ])

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
  }, [codeHistory, setGeneratedCode, setGeneratedFiles, setSelectedFile, setCodeHistory, setChatHistory])


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
  }, [repoName, repoDescription, githubToken, githubEnabled, setIsGithubProcessing, setRepoName, setRepoDescription])

  const cloneGithubRepo = useCallback(async () => {
    alert('Clone functionality requires server-side implementation')
  }, [])

  const pushToGithub = useCallback(async () => {
    alert('Push functionality requires server-side implementation')
  }, [])

  // Preview mode toggle, shouldShowLivePreview, and
  // getCombinedPreviewContent moved into PreviewPanel in W1 PR-3
  // (components/preview/PreviewPanel.tsx).

  // Memoized values
  const hasGeneratedCode = useMemo(() => generatedCode.length > 0, [generatedCode])
  const systemStatus = useMemo(() => ({
    supabase: supabaseEnabled,
    github: githubEnabled,
    aiProvider,
    openrouterServerAvailable
  }), [supabaseEnabled, githubEnabled, aiProvider, openrouterServerAvailable])
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

      {/* Header — extracted in W1 PR-3 -> components/layout/Header.tsx */}
      <Header />

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
        aiProvider={aiProvider}
        onAiProviderChange={handleAiProviderChange}
        openrouterConfig={{
          apiKey: openrouterKey,
          model: openrouterModel,
          customSlug: openrouterCustomSlug,
          maxTokens: openrouterMaxTokens,
          serverAvailable: openrouterServerAvailable,
          setApiKey: setOpenrouterKey,
          setModel: setOpenrouterModel,
          setCustomSlug: setOpenrouterCustomSlug,
          setMaxTokens: setOpenrouterMaxTokens
        }}
        onOpenrouterSave={saveOpenrouterSettings}
      />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

          <div className="lg:col-span-4 flex flex-col gap-6">
            <GenerationPanel onGenerate={handleGenerate} />

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

          <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden min-h-0">
            <FileBrowser />

            <PreviewPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export wrapped in error boundary + hydration gate.
//
// HydrationGate runs the legacy-localStorage migration on first mount
// and waits for all persisted Zustand stores (settings, integrations,
// templates) to rehydrate before rendering <AIWebsitePowerhouse />.
// This prevents the one-frame default-values flicker called out in
// PLAN/Section-06-Refactor-Plan.md §3 PR-2.
export default function AIWebsitePowerhouseWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <HydrationGate>
        <AIWebsitePowerhouse />
      </HydrationGate>
    </ErrorBoundary>
  )
}

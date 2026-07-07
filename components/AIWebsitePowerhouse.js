'use client'

import { useEffect, useCallback, useMemo, memo } from 'react'
import {
  Loader2, Download,
  X, Github, GitBranch, Upload,
} from 'lucide-react'
import {
  CUSTOM_MODEL_ID,
  DEFAULT_OLLAMA_MODEL_ID,
} from '@/lib/models'
import { generateStream } from '@/lib/llm'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { HydrationGate } from '@/components/shared/HydrationGate'
import { Header } from '@/components/layout/Header'
import { GenerationPanel } from '@/components/generation/GenerationPanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { FileBrowser } from '@/components/files/FileBrowser'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { DeployModal } from '@/components/modals/DeployModal'
import { RestoreWorkModal } from '@/components/modals/RestoreWorkModal'
import { debounce } from '@/lib/utils/debounce'
import { parseGeneratedFiles } from '@/lib/generation/parser'
import { buildSystemPrompt } from '@/lib/prompts/system-prompt'
import { buildModifyPrompt } from '@/lib/prompts/modify-prompt'
import { useSettingsStore } from '@/lib/store/settings-store'
import { useIntegrationsStore } from '@/lib/store/integrations-store'
import { useGenerationStore } from '@/lib/store/generation-store'
import { useChatStore } from '@/lib/store/chat-store'
import { useUiStore } from '@/lib/store/ui-store'
import { saveSnapshot, hasSnapshot } from '@/lib/store/autosave'

// DeployModal extracted in W1 PR-4 -> components/modals/DeployModal.tsx

// RestoreWorkModal extracted in W1 PR-4 -> components/modals/RestoreWorkModal.tsx

// SettingsPanel extracted in W1 PR-4 -> components/settings/SettingsPanel.tsx
// (shell + ProviderToggle/OllamaSection/SamplingParams/SupabaseSection/
// GithubSection/OpenRouterSection/SystemStatusList/DangerZone sections)

// Memoized GitHub Panel — stays inline until W1 PR-5, when the
// clone/push alert() stubs are deleted per Section 6 §7 item 3 and the
// remaining shell moves behind a feature flag until W9.
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

// ChatInterface extracted in W1 PR-4 -> components/chat/ChatInterface.tsx
// (shell + MessageList/MessageInput)

// FileBrowser extracted in W1 PR-3 -> components/files/FileBrowser.tsx

// PreviewPanel extracted in W1 PR-3 -> components/preview/PreviewPanel.tsx

// Main Component
function AIWebsitePowerhouse() {
  // Generation Store — `prompt` is read for the generate call; the write
  // side (`setPrompt`) moved into PromptForm/TemplatePicker with PR-3.
  // The undo stack write-side (`codeHistory` value + `undoLastChange`)
  // moved into ChatInterface with PR-4; only the functional-update
  // setter is still needed here (handleChatModify pushes snapshots).
  const prompt = useGenerationStore((s) => s.prompt)
  const generatedCode = useGenerationStore((s) => s.generatedCode)
  const setGeneratedCode = useGenerationStore((s) => s.setGeneratedCode)
  const generatedFiles = useGenerationStore((s) => s.generatedFiles)
  const setGeneratedFiles = useGenerationStore((s) => s.setGeneratedFiles)
  const selectedFile = useGenerationStore((s) => s.selectedFile)
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile)
  const setIsGenerating = useGenerationStore((s) => s.setIsGenerating)
  const setCodeHistory = useGenerationStore((s) => s.setCodeHistory)
  const setGenerationStats = useGenerationStore((s) => s.setGenerationStats)

  // Chat Store — display state moved into MessageList/MessageInput with
  // PR-4; the values kept here feed the autosave effect and the two
  // generation handlers.
  const chatHistory = useChatStore((s) => s.chatHistory)
  const setChatHistory = useChatStore((s) => s.setChatHistory)
  const chatMessage = useChatStore((s) => s.chatMessage)
  const setChatMessage = useChatStore((s) => s.setChatMessage)

  // UI Store — the modal-visibility selectors moved into the extracted
  // modal/panel components with PR-4. Still owned here: the mount-time
  // restore prompt trigger, the OpenRouter availability probe write,
  // and the GitHub-panel form state (GithubPanel is inline until PR-5).
  const showGithubPanel = useUiStore((s) => s.showGithubPanel)
  const setShowGithubPanel = useUiStore((s) => s.setShowGithubPanel)
  const setShowRestoreModal = useUiStore((s) => s.setShowRestoreModal)
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

  // Settings Store — values only. Every settings write moved into the
  // Settings section components (components/settings/) with PR-4.
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl)
  const aiProvider = useSettingsStore((s) => s.aiProvider)
  const openrouterKey = useSettingsStore((s) => s.openrouterKey)
  const openrouterModel = useSettingsStore((s) => s.openrouterModel)
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug)
  const openrouterMaxTokens = useSettingsStore((s) => s.openrouterMaxTokens)
  const numCtx = useSettingsStore((s) => s.numCtx)
  const temperature = useSettingsStore((s) => s.temperature)
  const topP = useSettingsStore((s) => s.topP)
  const topK = useSettingsStore((s) => s.topK)

  // Integrations Store — values only; writes moved into
  // SupabaseSection/GithubSection with PR-4. Supabase trio feeds the
  // prompt builders; GitHub pair feeds the inline GithubPanel.
  const supabaseUrl = useIntegrationsStore((s) => s.supabaseUrl)
  const supabaseKey = useIntegrationsStore((s) => s.supabaseKey)
  const supabaseEnabled = useIntegrationsStore((s) => s.supabaseEnabled)
  const githubToken = useIntegrationsStore((s) => s.githubToken)
  const githubEnabled = useIntegrationsStore((s) => s.githubEnabled)

  // Refs — iframeRef moved into PreviewPanel in W1 PR-3.

  // Mount-time connectivity probe for Ollama. The change-time re-probe
  // moved into components/settings/OllamaSection.tsx with PR-4; both
  // collapse into a real model list when the model picker is rebuilt in
  // the W5 generation refactor.
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

  // Restore/discard/clear-saved-work callbacks moved into
  // RestoreWorkModal and DangerZone in W1 PR-4.

  // Settings-save callbacks (Supabase/GitHub/OpenRouter/provider/Ollama
  // URL) moved into the components/settings/ sections in W1 PR-4.

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

  // Undo moved into ChatInterface in W1 PR-4
  // (components/chat/ChatInterface.tsx).

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

  // The hasGeneratedCode/canUndo memos moved into ChatInterface and the
  // systemStatus memo into SystemStatusList in W1 PR-4.

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] text-gray-900">
      {/* Restore Work Modal — extracted in W1 PR-4 -> components/modals/RestoreWorkModal.tsx */}
      <RestoreWorkModal />

      {/* Deploy Modal — extracted in W1 PR-4 -> components/modals/DeployModal.tsx */}
      <DeployModal />

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

      {/* Settings Panel — extracted in W1 PR-4 -> components/settings/SettingsPanel.tsx */}
      <SettingsPanel />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

          <div className="lg:col-span-4 flex flex-col gap-6">
            <GenerationPanel onGenerate={handleGenerate} />

            <ChatInterface onChatSubmit={handleChatModify} />
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

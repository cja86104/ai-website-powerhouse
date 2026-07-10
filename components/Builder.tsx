"use client";

/**
 * Builder — the composition root that replaced the legacy
 * `components/AIWebsitePowerhouse.js` monolith at the end of the W1
 * refactor (PR-5). Everything presentational lives in the extracted
 * subcomponents; what remains here is exactly the cross-cutting logic
 * that has to see the whole generation config:
 *
 *  - `handleGenerate` / `handleChatModify` — the two `generateStream`
 *    call sites (call signatures preserved verbatim per Section 6 §5).
 *  - The mount-time bootstrap effect (Ollama connectivity probe,
 *    OpenRouter server-key probe, autosave restore prompt).
 *  - The workspace load (DB-backed since W2 Fri) and per-round
 *    persistence via lib/projects/actions.
 *  - The global keyboard shortcuts (Ctrl/Cmd+Enter, +S, +Z) that drive
 *    the `data-shortcut` buttons rendered by the subcomponents.
 *
 * The default export wraps the tree in ErrorBoundary + HydrationGate.
 * HydrationGate runs the legacy-localStorage migration on first mount
 * and waits for all persisted Zustand stores (settings, integrations,
 * templates) to rehydrate before rendering, preventing the one-frame
 * default-values flicker called out in Section 6 §3 PR-2.
 */

import { useCallback, useEffect, useRef } from "react";
import { CUSTOM_MODEL_ID, DEFAULT_OLLAMA_MODEL_ID } from "@/lib/models";
import { generateStream } from "@/lib/llm";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { HydrationGate } from "@/components/shared/HydrationGate";
import { Header } from "@/components/layout/Header";
import { GenerationPanel } from "@/components/generation/GenerationPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { FileBrowser } from "@/components/files/FileBrowser";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { DeployModal } from "@/components/modals/DeployModal";
import { GithubPanel } from "@/components/modals/GithubPanel";
import { effectiveTemperature } from "@/lib/utils/sampling";
import { parseGeneratedFiles } from "@/lib/generation/parser";
import {
  parseProjectFiles,
  serializeProjectFiles,
} from "@/lib/generation/project-parser";
import { ensureReactScaffold } from "@/lib/generation/react-scaffold";
import type { GeneratedFile } from "@/lib/generation/types";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import { buildModifyPrompt } from "@/lib/prompts/modify-prompt";
import { buildReactSystemPrompt } from "@/lib/prompts/react-system-prompt";
import { buildReactModifyPrompt } from "@/lib/prompts/react-modify-prompt";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  useChatStore,
  type ChatMessage as ChatThreadMessage,
} from "@/lib/store/chat-store";
import { useUiStore } from "@/lib/store/ui-store";
import {
  loadWorkspace,
  persistGeneration,
  startNewProject,
} from "@/lib/projects/actions";
import { loadOpenrouterKey } from "@/lib/integrations/actions";
import { listUserTemplates } from "@/lib/templates/actions";
import { useTemplatesStore } from "@/lib/store/templates-store";

/** Throttle interval (ms) for streaming UI updates during generation. */
const UPDATE_INTERVAL = 150;

/** Optional explicit project to open — set by /p/[projectId] (W7). */
export interface BuilderProps {
  initialProjectId?: string;
}

function Builder({ initialProjectId }: BuilderProps) {
  // Generation Store — `prompt` is read for the generate call; the
  // write side lives in PromptForm/TemplatePicker (PR-3). The undo
  // stack read side lives in ChatInterface (PR-4); only the
  // functional-update setter is needed here.
  const prompt = useGenerationStore((s) => s.prompt);
  const setPrompt = useGenerationStore((s) => s.setPrompt);
  const generatedCode = useGenerationStore((s) => s.generatedCode);
  const setGeneratedCode = useGenerationStore((s) => s.setGeneratedCode);
  const generatedFiles = useGenerationStore((s) => s.generatedFiles);
  const setGeneratedFiles = useGenerationStore((s) => s.setGeneratedFiles);
  const selectedFile = useGenerationStore((s) => s.selectedFile);
  const setSelectedFile = useGenerationStore((s) => s.setSelectedFile);
  const setIsGenerating = useGenerationStore((s) => s.setIsGenerating);
  const setCodeHistory = useGenerationStore((s) => s.setCodeHistory);
  const setGenerationStats = useGenerationStore((s) => s.setGenerationStats);
  const framework = useGenerationStore((s) => s.framework);
  const setFramework = useGenerationStore((s) => s.setFramework);
  const setProjectId = useGenerationStore((s) => s.setProjectId);

  // Chat Store — display state lives in MessageList/MessageInput
  // (PR-4); the values here feed the two generation handlers.
  const setChatHistory = useChatStore((s) => s.setChatHistory);
  const chatMessage = useChatStore((s) => s.chatMessage);
  const setChatMessage = useChatStore((s) => s.setChatMessage);

  const setUserTemplates = useTemplatesStore((s) => s.setUserTemplates);

  // UI Store — every modal/panel owns its own visibility selector now;
  // Builder only records the OpenRouter probe result.
  const setOpenrouterServerAvailable = useUiStore(
    (s) => s.setOpenrouterServerAvailable,
  );

  // Settings Store — values only; every write lives in the Settings
  // section components (PR-4).
  const ollamaUrl = useSettingsStore((s) => s.ollamaUrl);
  const aiProvider = useSettingsStore((s) => s.aiProvider);
  const openrouterKey = useSettingsStore((s) => s.openrouterKey);
  const setOpenrouterKey = useSettingsStore((s) => s.setOpenrouterKey);
  const openrouterModel = useSettingsStore((s) => s.openrouterModel);
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug);
  const openrouterMaxTokens = useSettingsStore((s) => s.openrouterMaxTokens);
  const numCtx = useSettingsStore((s) => s.numCtx);
  const temperature = useSettingsStore((s) => s.temperature);
  const topP = useSettingsStore((s) => s.topP);
  const topK = useSettingsStore((s) => s.topK);

  // Workspace identity (W2 Fri). Refs, not state: the generation
  // callbacks read them without needing re-renders or dep churn.
  const projectIdRef = useRef<string | null>(null);
  const latestGenerationIdRef = useRef<string | null>(null);

  // Integrations Store — no selectors needed here since PR-5: the
  // Supabase trio left with the prompt-builder dead-branch cleanup and
  // the GitHub pair lives inside GithubPanel.

  // Mount-time connectivity probe for Ollama. The change-time re-probe
  // lives in components/settings/OllamaSection.tsx (PR-4); both
  // collapse into a real model list when the model picker is rebuilt
  // in the W5 generation refactor.
  const fetchAvailableModels = useCallback(async (url: string) => {
    try {
      await fetch(`${url}/api/tags`);
    } catch (error) {
      console.log(
        "Could not reach Ollama:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }, []);

  // Mount-time bootstrap: hydration of persisted settings is handled by
  // <HydrationGate>, so by the time this effect runs every persisted
  // value (ollamaUrl, openrouterKey, etc.) is already on the store.
  // What's left to do at mount:
  //  1. Probe Ollama connectivity (best-effort; preserves the no-op
  //     network ping the legacy code did so server-side issues surface
  //     in DevTools).
  //  2. Probe the /api/openrouter availability endpoint.
  //  3. Load the user's workspace from the database (W2 Fri) —
  //     project identity, latest files, and the chat thread.
  //
  // The intentionally empty dep array runs this once per mount. We
  // intentionally do NOT depend on `ollamaUrl` — re-running this on
  // URL change would re-probe and double-prompt restore.
  useEffect(() => {
    fetchAvailableModels(ollamaUrl);

    // Probe server-side OpenRouter availability (best-effort)
    fetch("/api/openrouter", { method: "GET" })
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((data: { available?: unknown }) =>
        setOpenrouterServerAvailable(Boolean(data && data.available)),
      )
      .catch(() => setOpenrouterServerAvailable(false));

    // Restore the account-stored BYOK key when this browser has none
    // (W5 UX). The mount-time closure value is post-hydration thanks
    // to HydrationGate, so "empty here" means "empty locally".
    if (openrouterKey.trim().length === 0) {
      loadOpenrouterKey()
        .then((storedKey) => {
          if (storedKey !== null) {
            setOpenrouterKey(storedKey);
          }
        })
        .catch((error: unknown) => {
          console.error("Key restore failed:", error);
        });
    }

    // Account templates are the source of truth; the localStorage
    // cache is replaced at every sign-in (2026-07-11).
    listUserTemplates()
      .then((templates) => setUserTemplates(templates))
      .catch((error: unknown) =>
        console.error("Template load failed:", error),
      );

    loadWorkspace(initialProjectId)
      .then((workspace) => {
        projectIdRef.current = workspace.projectId;
        latestGenerationIdRef.current = workspace.latestGenerationId;
        setProjectId(workspace.projectId);
        setFramework(workspace.framework);
        if (workspace.files.length > 0) {
          setGeneratedFiles(workspace.files);
          setGeneratedCode(workspace.generatedCode);
          setSelectedFile(workspace.files[0]);
        }
        if (workspace.chatHistory.length > 0) {
          setChatHistory(workspace.chatHistory);
        }
      })
      .catch((error: unknown) => {
        console.error("Workspace load failed:", error);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Could not load your saved work: ${
              error instanceof Error ? error.message : String(error)
            }. Reload the page to retry.`,
          },
        ]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAvailableModels]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter: Generate website
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        // Trigger generate button click if conditions are met
        const generateBtn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="generate"]',
        );
        if (generateBtn && !generateBtn.disabled) {
          generateBtn.click();
        }
      }

      // Ctrl+S or Cmd+S: Download as ZIP
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const zipBtn = document.querySelector<HTMLButtonElement>(
          '[data-shortcut="download-zip"]',
        );
        if (zipBtn && !zipBtn.disabled) {
          zipBtn.click();
        }
      }

      // Ctrl+Z or Cmd+Z: Undo (only when not in input/textarea)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        const activeEl = document.activeElement;
        const isInInput =
          activeEl !== null &&
          (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA");
        if (!isInInput) {
          e.preventDefault();
          const undoBtn = document.querySelector<HTMLButtonElement>(
            '[data-shortcut="undo"]',
          );
          if (undoBtn && !undoBtn.disabled) {
            undoBtn.click();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Start fresh (W5 UX follow-up): archives the current project and
  // opens a clean workspace. Nothing is destroyed — archived projects
  // return as history with the W7 dashboard.
  const handleNewProject = useCallback(async () => {
    if (
      !confirm(
        "Start a new project? Your current work is saved and will reappear when project history ships.",
      )
    ) {
      return;
    }
    try {
      const fresh = await startNewProject(projectIdRef.current);
      projectIdRef.current = fresh.projectId;
      latestGenerationIdRef.current = null;
      setProjectId(fresh.projectId);
      setFramework(fresh.framework);
      setPrompt("");
      setGeneratedCode("");
      setGeneratedFiles([]);
      setSelectedFile(null);
      setChatHistory([]);
      setCodeHistory([]);
      setGenerationStats(null);
    } catch (error) {
      console.error("New project failed:", error);
      alert(
        `Could not start a new project: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }, [
    setProjectId,
    setFramework,
    setPrompt,
    setGeneratedCode,
    setGeneratedFiles,
    setSelectedFile,
    setChatHistory,
    setCodeHistory,
    setGenerationStats,
  ]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedCode("");
    setGeneratedFiles([]);
    setSelectedFile(null);
    setChatHistory([]);
    setCodeHistory([]);
    setGenerationStats(null);

    // Framework fork (W5): React/Vite projects use the marker-format
    // prompt + structured parser; 'html' keeps the legacy path intact.
    const isReact = framework === "react-vite";
    const systemPrompt = isReact
      ? buildReactSystemPrompt()
      : buildSystemPrompt();

    // Resolve the effective OpenRouter model. The CUSTOM_MODEL_ID sentinel
    // means the user picked "Custom…" in the dropdown and typed their own slug.
    const effectiveOrModel =
      openrouterModel === CUSTOM_MODEL_ID
        ? openrouterCustomSlug.trim()
        : openrouterModel;

    let lastUpdateTime = Date.now();
    let capturedError: Error | null = null;

    try {
      await generateStream({
        provider: aiProvider,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        ollamaConfig: {
          url: ollamaUrl,
          model: DEFAULT_OLLAMA_MODEL_ID,
          num_ctx: numCtx,
          temperature: effectiveTemperature(temperature),
          top_p: topP,
          top_k: topK,
          repeat_penalty: 1.1,
        },
        openrouterConfig: {
          apiKey: openrouterKey.trim() || null,
          model: effectiveOrModel,
          temperature: effectiveTemperature(temperature),
          top_p: topP,
          max_tokens: openrouterMaxTokens,
        },
        onChunk: (_fragment, accumulated) => {
          const now = Date.now();
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            setGeneratedCode(accumulated);
            lastUpdateTime = now;
          }
        },
        onDone: (fullText) => {
          setGeneratedCode(fullText);
          const cleanedCode = fullText.trim();
          // Structured parse for React projects; if the model ignored
          // the marker format entirely, rescue via the legacy parser
          // rather than presenting an empty result.
          let files: GeneratedFile[] = isReact
            ? parseProjectFiles(cleanedCode)
            : parseGeneratedFiles(cleanedCode);
          if (isReact && files.length === 0) {
            files = parseGeneratedFiles(cleanedCode);
          }
          if (isReact) {
            // Backstop (W5 Fri): inject the pinned scaffold files if
            // the model forgot them — ZIPs must always be runnable.
            files = ensureReactScaffold(files);
          }
          setGeneratedFiles(files);
          if (files.length > 0) {
            setSelectedFile(files[0]);
          }

          // Persist the completed round (W2 Fri). Fire-and-forget:
          // a save failure must never destroy the in-memory result.
          if (projectIdRef.current !== null && files.length > 0) {
            persistGeneration({
              projectId: projectIdRef.current,
              kind: "initial",
              prompt,
              provider: aiProvider,
              model:
                aiProvider === "ollama"
                  ? DEFAULT_OLLAMA_MODEL_ID
                  : effectiveOrModel,
              usedByoKey:
                aiProvider === "openrouter" && openrouterKey.trim().length > 0,
              parentGenerationId: null,
              files,
              newMessages: [],
            })
              .then((generationId) => {
                latestGenerationIdRef.current = generationId;
              })
              .catch((error: unknown) => {
                console.error("Persist failed:", error);
                setChatHistory((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Heads up: this result could not be saved to your account (${
                      error instanceof Error ? error.message : String(error)
                    }). It is still on screen — your next successful save will include it.`,
                  },
                ]);
              });
          }
        },
        onError: (err) => {
          capturedError = err;
        },
      });

      if (capturedError !== null) {
        throw capturedError;
      }
    } catch (error) {
      console.error("Generation error:", error);
      const providerLabel = aiProvider === "ollama" ? "Ollama" : "OpenRouter";
      const hint =
        aiProvider === "ollama"
          ? "Make sure Ollama is running!"
          : "Check your OpenRouter API key and selected model in Settings.";
      const message = error instanceof Error ? error.message : String(error);
      alert(`Error generating website (${providerLabel}): ${message}\n\n${hint}`);
    } finally {
      setIsGenerating(false);
    }
  }, [
    prompt,
    framework,
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
  ]);

  const handleChatModify = useCallback(async () => {
    if (!chatMessage.trim() || !generatedCode) return;

    // Save current version to history before modifying
    setCodeHistory((prev) => [
      ...prev,
      {
        files: [...generatedFiles],
        code: generatedCode,
        timestamp: Date.now(),
      },
    ]);

    const userMessage: ChatThreadMessage = {
      role: "user",
      content: chatMessage,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage("");
    setIsGenerating(true);

    const isReact = framework === "react-vite";
    const modifyPrompt = isReact
      ? buildReactModifyPrompt({
          serializedProject: serializeProjectFiles(generatedFiles),
          chatMessage,
        })
      : buildModifyPrompt({
          generatedCode,
          chatMessage,
        });

    // Resolve the effective OpenRouter model. Same rule as handleGenerate.
    const effectiveOrModel =
      openrouterModel === CUSTOM_MODEL_ID
        ? openrouterCustomSlug.trim()
        : openrouterModel;

    let lastUpdateTime = Date.now();
    let capturedError: Error | null = null;

    try {
      await generateStream({
        provider: aiProvider,
        messages: [{ role: "user", content: modifyPrompt }],
        ollamaConfig: {
          url: ollamaUrl,
          model: DEFAULT_OLLAMA_MODEL_ID,
          num_ctx: numCtx,
          temperature: effectiveTemperature(temperature),
          top_p: topP,
          top_k: topK,
          repeat_penalty: 1.1,
        },
        openrouterConfig: {
          apiKey: openrouterKey.trim() || null,
          model: effectiveOrModel,
          temperature: effectiveTemperature(temperature),
          top_p: topP,
          max_tokens: openrouterMaxTokens,
        },
        onChunk: (_fragment, accumulated) => {
          const now = Date.now();
          if (now - lastUpdateTime >= UPDATE_INTERVAL) {
            setGeneratedCode(accumulated);
            lastUpdateTime = now;
          }
        },
        onDone: (fullText) => {
          setGeneratedCode(fullText);
          const cleanedCode = fullText.trim();
          let files: GeneratedFile[] = isReact
            ? parseProjectFiles(cleanedCode)
            : parseGeneratedFiles(cleanedCode);
          if (isReact && files.length === 0) {
            files = parseGeneratedFiles(cleanedCode);
          }
          if (isReact) {
            // Backstop (W5 Fri): inject the pinned scaffold files if
            // the model forgot them — ZIPs must always be runnable.
            files = ensureReactScaffold(files);
          }
          setGeneratedFiles(files);
          if (selectedFile) {
            const updatedFile = files.find((f) => f.name === selectedFile.name);
            setSelectedFile(updatedFile || files[0]);
          }
          const assistantMessage: ChatThreadMessage = {
            role: "assistant",
            content: "Website updated successfully!",
          };
          setChatHistory((prev) => [...prev, assistantMessage]);

          // Persist the completed modify round (W2 Fri).
          if (projectIdRef.current !== null && files.length > 0) {
            persistGeneration({
              projectId: projectIdRef.current,
              kind: "modify",
              prompt: userMessage.content,
              provider: aiProvider,
              model:
                aiProvider === "ollama"
                  ? DEFAULT_OLLAMA_MODEL_ID
                  : effectiveOrModel,
              usedByoKey:
                aiProvider === "openrouter" && openrouterKey.trim().length > 0,
              parentGenerationId: latestGenerationIdRef.current,
              files,
              newMessages: [userMessage, assistantMessage],
            })
              .then((generationId) => {
                latestGenerationIdRef.current = generationId;
              })
              .catch((error: unknown) => {
                console.error("Persist failed:", error);
                setChatHistory((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: `Heads up: this update could not be saved to your account (${
                      error instanceof Error ? error.message : String(error)
                    }). It is still on screen — your next successful save will include it.`,
                  },
                ]);
              });
          }
        },
        onError: (err) => {
          capturedError = err;
        },
      });

      if (capturedError !== null) {
        throw capturedError;
      }
    } catch (error) {
      console.error("Modification error:", error);
      const errorMessage: ChatThreadMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [
    chatMessage,
    generatedCode,
    generatedFiles,
    framework,
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
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] text-gray-900">
      <DeployModal />

      <Header />

      <GithubPanel />

      <SettingsPanel />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <GenerationPanel
              onGenerate={handleGenerate}
              onNewProject={handleNewProject}
            />

            <ChatInterface onChatSubmit={handleChatModify} />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden min-h-0">
            <FileBrowser />

            <PreviewPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Default export: Builder wrapped in ErrorBoundary + HydrationGate.
 * See the module docblock for why the gate must wrap the tree.
 */
export default function BuilderWithErrorBoundary({
  initialProjectId,
}: BuilderProps = {}) {
  return (
    <ErrorBoundary>
      <HydrationGate>
        <Builder initialProjectId={initialProjectId} />
      </HydrationGate>
    </ErrorBoundary>
  );
}

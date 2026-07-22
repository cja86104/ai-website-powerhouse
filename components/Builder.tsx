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
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { AssetsPanel } from "@/components/assets/AssetsPanel";
import { listProjectAssets } from "@/lib/assets/client";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { DeployModal } from "@/components/modals/DeployModal";
import { GithubPanel } from "@/components/modals/GithubPanel";
import { effectiveTemperature } from "@/lib/utils/sampling";
import { parseGeneratedFiles } from "@/lib/generation/parser";
import {
  mergeProjectFiles,
  parseDeletedPaths,
  parseProjectFiles,
  serializeProjectFiles,
} from "@/lib/generation/project-parser";
import {
  ensureLocalImportsResolve,
  ensureReactScaffold,
  localImportStubNote,
} from "@/lib/generation/react-scaffold";
import {
  findForbiddenImports,
  forbiddenImportWarning,
} from "@/lib/generation/import-validator";
import { renumberImageSlots } from "@/lib/generation/slot-renumber";
import {
  applyImageUrls,
  extractSlots,
  parseImagePassResponse,
} from "@/lib/generation/image-pass";
import type { GeneratedFile } from "@/lib/generation/types";
import { buildSystemPrompt } from "@/lib/prompts/system-prompt";
import { buildModifyPrompt } from "@/lib/prompts/modify-prompt";
import { buildReactSystemPrompt } from "@/lib/prompts/react-system-prompt";
import { buildReactModifyPrompt } from "@/lib/prompts/react-modify-prompt";
import { buildScopedModifyPrompt } from "@/lib/prompts/scoped-modify-prompt";
import { IMAGE_PASS_PROMPT } from "@/lib/prompts/image-slots";
import { extractScopedFileContent } from "@/lib/generation/scoped-parser";
import { useSettingsStore } from "@/lib/store/settings-store";
import { useGenerationStore } from "@/lib/store/generation-store";
import {
  useChatStore,
  type ChatMessage as ChatThreadMessage,
} from "@/lib/store/chat-store";
import { useUiStore } from "@/lib/store/ui-store";
import {
  loadGenerationFiles,
  loadWorkspace,
  persistGeneration,
  startNewProject,
} from "@/lib/projects/actions";
import { loadOpenrouterProfile } from "@/lib/integrations/actions";
import { listUserTemplates } from "@/lib/templates/actions";
import { useTemplatesStore } from "@/lib/store/templates-store";

/** Throttle interval (ms) for streaming UI updates during generation. */
const UPDATE_INTERVAL = 150;

/**
 * Rebuild the raw text buffer from parsed files — client-side twin of
 * the server's joinFiles (lib/projects/actions.ts), kept semantically
 * identical so the modify prompt sees the same context either way.
 */
function joinFilesForFramework(
  files: GeneratedFile[],
  framework: string,
): string {
  if (files.length === 0) return "";
  if (framework === "react-vite") return serializeProjectFiles(files);
  if (files.length === 1) return files[0].content;
  return files
    .map((f) => `<!-- FILE: ${f.name} -->\n${f.content}`)
    .join("\n\n");
}

/**
 * Prompt ride-along for uploaded images (2026-07-12): when the user
 * has uploaded photos/logos, every generate/modify request tells the
 * model to use the REAL image URLs instead of placeholders. Appended
 * to the outgoing prompt only — persisted prompts/messages stay
 * clean.
 */
function buildAssetsNote(assets: { name: string; url: string }[]): string {
  if (assets.length === 0) return "";
  const lines = assets.map((a) => `- ${a.name}: ${a.url}`).join("\n");
  return (
    "\n\nUSER-UPLOADED IMAGES — the user provided these real images. " +
    "Use their exact URLs in <img> tags or CSS backgrounds wherever an " +
    "image fits the design, instead of placeholders or stock photos:\n" +
    lines
  );
}

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
  const assets = useGenerationStore((s) => s.assets);
  const setAssets = useGenerationStore((s) => s.setAssets);

  // Chat Store — display state lives in MessageList/MessageInput
  // (PR-4); the values here feed the two generation handlers.
  const setChatHistory = useChatStore((s) => s.setChatHistory);
  const chatMessage = useChatStore((s) => s.chatMessage);
  const setChatMessage = useChatStore((s) => s.setChatMessage);
  const scopedFilePath = useChatStore((s) => s.scopedFilePath);
  const setScopedFilePath = useChatStore((s) => s.setScopedFilePath);

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
  const setOpenrouterModel = useSettingsStore((s) => s.setOpenrouterModel);
  const openrouterCustomSlug = useSettingsStore((s) => s.openrouterCustomSlug);
  const setOpenrouterCustomSlug = useSettingsStore(
    (s) => s.setOpenrouterCustomSlug,
  );
  const openrouterMaxTokens = useSettingsStore((s) => s.openrouterMaxTokens);
  const setOpenrouterMaxTokens = useSettingsStore(
    (s) => s.setOpenrouterMaxTokens,
  );
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

    // Restore the account-stored OpenRouter profile (W5 UX key;
    // 2026-07-12 model/slug/tokens). The ACCOUNT is the source of
    // truth for model, custom slug, and max tokens — the model a user
    // generated with is the model their next session edits with, on
    // any browser. The key only fills in when this browser has none
    // (mount-time closure is post-hydration thanks to HydrationGate,
    // so "empty here" means "empty locally") — never clobber a key
    // the user just typed.
    loadOpenrouterProfile()
      .then((profile) => {
        if (profile === null) return;
        if (profile.key !== null && openrouterKey.trim().length === 0) {
          setOpenrouterKey(profile.key);
        }
        if (profile.model !== null && profile.model.length > 0) {
          setOpenrouterModel(profile.model);
        }
        if (profile.customSlug !== null) {
          setOpenrouterCustomSlug(profile.customSlug);
        }
        if (profile.maxTokens !== null && profile.maxTokens >= 1024) {
          setOpenrouterMaxTokens(profile.maxTokens);
        }
      })
      .catch((error: unknown) => {
        console.error("Settings restore failed:", error);
      });

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
        // UNCONDITIONAL reset (2026-07-12 user-reported): the stores
        // are singletons that survive client-side navigation, so an
        // "only set when non-empty" load kept the PREVIOUS project's
        // chat/files on screen whenever the opened project was empty.
        // Whatever this project has — including nothing — is what
        // the workspace shows.
        setGeneratedFiles(workspace.files);
        setGeneratedCode(workspace.generatedCode);
        setSelectedFile(workspace.files.length > 0 ? workspace.files[0] : null);
        setChatHistory(workspace.chatHistory);
        setCodeHistory([]);
        setGenerationStats(null);
        setScopedFilePath(null);
        // Uploaded images ride along on every prompt — load them with
        // the workspace so the first Generate already knows about them.
        listProjectAssets(workspace.projectId)
          .then((loaded) => setAssets(loaded))
          .catch((error: unknown) => {
            console.error("Asset list failed:", error);
          });
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

  // Post-parse safety net (2026-07-12, user-reported react-scroll
  // case): if the model imported a package that isn't installed, put
  // a plain-language recovery message in the chat BEFORE the user
  // meets vite's red overlay. Detection only — see import-validator.
  const warnOnForbiddenImports = useCallback(
    (files: GeneratedFile[]) => {
      const warning = forbiddenImportWarning(findForbiddenImports(files));
      if (warning !== null) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: warning },
        ]);
      }
    },
    [setChatHistory],
  );

  // Post-parse safety net (2026-07-14, user-reported "Failed to
  // resolve import" on first generation): the model sometimes
  // references a local page/component it never emitted, which crashes
  // Sandpack's bundler before React ever mounts. ensureLocalImportsResolve
  // injects a safe placeholder so the preview always loads; this just
  // tells the user it happened.
  const warnOnMissingLocalImports = useCallback(
    (injectedPaths: string[]) => {
      const note = localImportStubNote(injectedPaths);
      if (note !== null) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: note },
        ]);
      }
    },
    [setChatHistory],
  );

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
      setAssets([]);
      setScopedFilePath(null);
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
    setAssets,
    setScopedFilePath,
  ]);

  // Open a historical version (W7 Wed). Loads that generation's file
  // snapshot into the workspace and re-points the modify chain at it:
  // the next chat edit will persist with parent_generation_id = the
  // restored generation, branching the history exactly where the user
  // resumed. Nothing is written to the database by the restore itself.
  const handleRestoreGeneration = useCallback(
    async (generationId: string) => {
      const files = await loadGenerationFiles(generationId);
      if (files.length === 0) {
        throw new Error("That version has no files.");
      }
      // Rebuild the raw buffer the same way loadWorkspace does, so the
      // modify prompt sees semantically identical context.
      const code = joinFilesForFramework(files, framework);
      setGeneratedFiles(files);
      setGeneratedCode(code);
      setSelectedFile(files[0]);
      setCodeHistory([]);
      latestGenerationIdRef.current = generationId;
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Opened an earlier version. Your next edit will continue from here — later versions stay in the history.",
        },
      ]);
    },
    [
      framework,
      setGeneratedFiles,
      setGeneratedCode,
      setSelectedFile,
      setCodeHistory,
      setChatHistory,
    ],
  );

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
          { role: "user", content: prompt + buildAssetsNote(assets) },
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
        onDone: async (fullText) => {
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
            warnOnForbiddenImports(files);
            // Backstop (2026-07-14): see ensureLocalImportsResolve doc
            // in lib/generation/react-scaffold.ts.
            const localImportResult = ensureLocalImportsResolve(files);
            files = localImportResult.files;
            warnOnMissingLocalImports(localImportResult.injectedPaths);
          }
          // Site-wide unique spot numbers, enforced client-side
          // (2026-07-12 — models number per component).
          files = renumberImageSlots(files);

          // Silent image-resolution pass (2026-07-21): a small, invisible
          // second call to the same proxy route, asking the model to
          // resolve each numbered slot to a real Unsplash photo URL
          // instead of the placehold.co fallback. `silent: true` skips
          // quota limits and premium metering server-side (see
          // app/api/openrouter/route.ts) — this is not a user-visible
          // generation and must never count against the user's quota.
          // Best-effort: any failure here is swallowed and logged — the
          // site already works with its placeholders, so a broken image
          // pass must never break generation itself. Runs for both
          // frameworks; data-aiwp-slot is honored in .jsx/.js/.html
          // alike (see lib/generation/slot-renumber.ts).
          const slots = extractSlots(files);
          if (Object.keys(slots).length > 0) {
            try {
              const slotLines = Object.entries(slots)
                .map(([n, alt]) => `Slot ${n}: ${alt}`)
                .join("\n");
              const imageResponse = await fetch("/api/openrouter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: effectiveOrModel,
                  messages: [
                    { role: "user", content: IMAGE_PASS_PROMPT(slotLines) },
                  ],
                  max_tokens: 1000,
                  stream: false,
                  silent: true,
                }),
              });
              if (imageResponse.ok) {
                const data = (await imageResponse.json()) as {
                  choices?: Array<{ message?: { content?: string } }>;
                };
                const text = data.choices?.[0]?.message?.content ?? "";
                const urls = parseImagePassResponse(text);
                if (urls !== null) {
                  files = applyImageUrls(files, urls);
                }
              }
            } catch (error) {
              console.log(
                "Image pass skipped (site still ships with placeholder images):",
                error instanceof Error ? error.message : String(error),
              );
            }
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
    assets,
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
    warnOnForbiddenImports,
    warnOnMissingLocalImports,
  ]);

  // `messageOverride` (W spots, 2026-07-12): programmatic senders —
  // the AssetsPanel Place button — pass the request text directly.
  // Typed `unknown` because DOM handlers pass the click event when
  // wired as onClick={onChatSubmit}; only a string is honored.
  const handleChatModify = useCallback(async (messageOverride?: unknown) => {
    const request =
      typeof messageOverride === "string" ? messageOverride : chatMessage;
    if (!request.trim() || !generatedCode) return;

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
      content: request,
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage("");
    setIsGenerating(true);

    const isReact = framework === "react-vite";

    // File-aware scope (W8 Mon): when the user picked one file in the
    // chat scope dropdown, use the single-file contract — the model
    // sees only that file (plus the path listing) and returns only its
    // updated content; every other file stays byte-untouched.
    const scopedFile =
      scopedFilePath !== null
        ? (generatedFiles.find((f) => f.name === scopedFilePath) ?? null)
        : null;

    // Outgoing request text carries the uploaded-image URLs; the
    // persisted user message (userMessage.content) stays clean.
    const chatRequest = request + buildAssetsNote(assets);
    const modifyPrompt =
      scopedFile !== null
        ? buildScopedModifyPrompt({
            filePath: scopedFile.name,
            fileContent: scopedFile.content,
            projectPaths: generatedFiles.map((f) => f.name),
            chatMessage: chatRequest,
          })
        : isReact
          ? buildReactModifyPrompt({
              serializedProject: serializeProjectFiles(generatedFiles),
              chatMessage: chatRequest,
            })
          : buildModifyPrompt({
              generatedCode,
              chatMessage: chatRequest,
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
          let files: GeneratedFile[];
          let assistantMessage: ChatThreadMessage;
          let missingLocalImportPaths: string[] = [];
          if (scopedFile !== null) {
            // Scoped contract: fullText IS the one file's new content
            // (tolerantly unfenced). Merge it over the scoped file and
            // rebuild the raw buffer from the full set.
            const updatedContent = extractScopedFileContent(fullText);
            files = renumberImageSlots(
              generatedFiles.map((f) =>
                f.name === scopedFile.name
                  ? { ...f, content: updatedContent }
                  : f,
              ),
            );
            setGeneratedCode(joinFilesForFramework(files, framework));
            assistantMessage = {
              role: "assistant",
              content: `Updated ${scopedFile.name}.`,
            };
          } else if (isReact) {
            // Delta contract (2026-07-12): the response contains ONLY
            // created/changed files plus explicit DELETE markers;
            // everything else is kept from the current set. A model
            // that re-emits the whole project anyway merges to the
            // same result. If marker parsing yields nothing at all,
            // fall back to the legacy whole-text parse as a full
            // replacement rather than presenting an empty result.
            const cleanedCode = fullText.trim();
            const changed = parseProjectFiles(cleanedCode);
            const deletedPaths = parseDeletedPaths(cleanedCode);
            let mergedNoOp = false;
            if (changed.length === 0 && deletedPaths.length === 0) {
              files = parseGeneratedFiles(cleanedCode);
            } else {
              files = mergeProjectFiles(generatedFiles, changed, deletedPaths);
              // No-op detection (2026-07-12 user report: "it said
              // updated successfully AND DID NOTHING"): if every
              // returned file is byte-identical to what we already
              // had, say so instead of claiming success.
              mergedNoOp =
                deletedPaths.length === 0 &&
                changed.every((f) =>
                  generatedFiles.some(
                    (g) => g.name === f.name && g.content === f.content,
                  ),
                );
            }
            // Backstop (W5 Fri): inject the pinned scaffold files if
            // the model forgot them — ZIPs must always be runnable.
            files = ensureReactScaffold(files);
            // Backstop (2026-07-14): see ensureLocalImportsResolve doc
            // in lib/generation/react-scaffold.ts.
            const localImportResult = ensureLocalImportsResolve(files);
            files = renumberImageSlots(localImportResult.files);
            missingLocalImportPaths = localImportResult.injectedPaths;
            // The raw buffer must reflect the FULL merged project so
            // the next modify round sees the real current state.
            setGeneratedCode(joinFilesForFramework(files, framework));
            assistantMessage = {
              role: "assistant",
              content: mergedNoOp
                ? "The model returned the files unchanged — nothing was modified. Try rephrasing (say what should be different and where), or pick the file in the dropdown above and ask again."
                : "Website updated successfully!",
            };
          } else {
            setGeneratedCode(fullText);
            const cleanedCode = fullText.trim();
            files = renumberImageSlots(parseGeneratedFiles(cleanedCode));
            assistantMessage = {
              role: "assistant",
              content: "Website updated successfully!",
            };
          }
          if (isReact) {
            warnOnForbiddenImports(files);
            warnOnMissingLocalImports(missingLocalImportPaths);
          }
          setGeneratedFiles(files);
          if (scopedFile !== null) {
            setSelectedFile(
              files.find((f) => f.name === scopedFile.name) ?? files[0],
            );
          } else if (selectedFile) {
            const updatedFile = files.find((f) => f.name === selectedFile.name);
            setSelectedFile(updatedFile || files[0]);
          }
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
              newMessages: [
                { ...userMessage, scopedFilePath: scopedFile?.name ?? null },
                assistantMessage,
              ],
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
    scopedFilePath,
    assets,
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
    warnOnForbiddenImports,
    warnOnMissingLocalImports,
  ]);

  // One-click photo placement (2026-07-12): the AssetsPanel turns a
  // thumbnail + a spot number into a precise modify request against
  // the data-aiwp-slot contract — no vocabulary needed from the user.
  const handlePlaceImage = useCallback(
    (asset: { name: string; url: string }, slot: number) => {
      void handleChatModify(
        `Put the image "${asset.name}" into image spot ${slot}: set the src (or background-image) of the element with data-aiwp-slot="${slot}" to exactly ${asset.url}. THE IMAGE MUST FIT INSIDE THAT ELEMENT'S EXISTING BOX: keep the container's current width, height, and layout classes exactly as they are, and make the image fill it (for an <img>, className "w-full h-full object-cover"; for a background, background-size cover). Never enlarge the container or change the page layout. Change nothing else.`,
      );
    },
    [handleChatModify],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942] text-gray-900">
      <DeployModal />

      <Header />

      <GithubPanel />

      <SettingsPanel />

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Fixed workspace height on desktop only; small screens flow
            naturally. The left rail scrolls INSIDE the grid (2026-07-19
            layout fix) — before this, its overflow spilled past the
            fixed-height row onto the page background. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)]">
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0 lg:overflow-y-auto lg:pr-1">
            <GenerationPanel
              onGenerate={handleGenerate}
              onNewProject={handleNewProject}
            />

            <HistoryPanel onRestore={handleRestoreGeneration} />

            <AssetsPanel onPlaceImage={handlePlaceImage} />

            <ChatInterface onChatSubmit={handleChatModify} />
          </div>

          <div className="lg:col-span-8 flex flex-col gap-4 lg:overflow-y-auto min-h-0">
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

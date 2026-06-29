/**
 * AI Website Powerhouse — Provider-Agnostic Streaming Helper
 *
 * Single entry point (`generateStream`) that both `handleGenerate` and
 * `handleChatModify` in components/AIWebsitePowerhouse.js call into. The
 * helper picks the right transport, parses the right stream format, and
 * delivers a uniform callback interface so the call sites do not need to
 * know which provider produced the bytes.
 *
 * Transport matrix:
 *
 *   provider = "ollama"
 *     → POST `${ollamaConfig.url}/api/generate`
 *     → body { model, prompt, stream: true, options: { num_ctx, ... } }
 *     → stream format: NDJSON, one `{ response, done }` object per line
 *     → preserves the exact wire behavior of the original inline fetch
 *
 *   provider = "openrouter", user-pasted API key present
 *     → POST https://openrouter.ai/api/v1/chat/completions
 *     → Authorization: Bearer <user key>
 *     → stream format: OpenAI-style SSE
 *
 *   provider = "openrouter", no user key
 *     → POST /api/openrouter (the proxy route from Section 2)
 *     → server attaches OPENROUTER_API_KEY env var
 *     → stream format: OpenAI-style SSE (passthrough from upstream)
 *
 * Callback contract:
 *   onChunk(fragment, accumulated)
 *     Fired once per delivered token fragment. `accumulated` is the full
 *     text produced so far (helper accumulates internally so call sites do
 *     not have to). Call sites can throttle UI updates off this signal.
 *   onDone(fullText)
 *     Fired exactly once on success with the complete generated text.
 *   onError(err)
 *     Fired exactly once on any failure — network error, non-2xx status,
 *     aborted signal, or thrown inside an upstream callback. `onDone` is
 *     NOT also fired in this case.
 *
 * The returned Promise always resolves; errors are delivered through
 * `onError`. Call sites can therefore wrap the call in a simple
 * try/finally to clear loading state without juggling rejection paths.
 */

import type { Provider } from "@/lib/models";

/** OpenAI-style chat message. Mirrors the shape the OpenRouter proxy validates. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Per-request configuration for the Ollama path. Mirrors the parameters
 * the original inline fetch sent so behavior stays identical.
 */
export interface OllamaConfig {
  /** Base URL of the Ollama server, e.g. "http://localhost:11434". */
  url: string;
  /** Model tag, e.g. "qwen3-coder:480b-cloud". */
  model: string;
  num_ctx: number;
  temperature: number;
  top_p: number;
  top_k: number;
  repeat_penalty: number;
}

/**
 * Per-request configuration for the OpenRouter path.
 *
 * `apiKey` semantics:
 *   - non-empty string → use the browser-direct path with this key
 *   - null / empty     → use the /api/openrouter server proxy (env fallback)
 */
export interface OpenRouterConfig {
  apiKey: string | null;
  /** OpenRouter model slug, e.g. "qwen/qwen3-coder-next". */
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

/** Public options accepted by `generateStream`. */
export interface GenerateStreamOptions {
  provider: Provider;
  /**
   * Conversation to send. The helper translates this to the right wire
   * format per provider:
   *   - Ollama   → joined into a single `prompt` string
   *   - OpenRouter → forwarded as a `messages` array unchanged
   */
  messages: ChatMessage[];
  ollamaConfig: OllamaConfig;
  openrouterConfig: OpenRouterConfig;
  /** Fired once per delivered text fragment. */
  onChunk: (fragment: string, accumulated: string) => void;
  /** Fired exactly once on success with the full generated text. */
  onDone: (fullText: string) => void;
  /** Fired exactly once on failure. `onDone` will not be fired in this case. */
  onError: (err: Error) => void;
  /** Optional abort signal; cancels the upstream fetch and the read loop. */
  signal?: AbortSignal;
}

const OPENROUTER_DIRECT_ENDPOINT =
  "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_PROXY_ENDPOINT = "/api/openrouter";
const APP_TITLE = "AI Website Powerhouse";

/**
 * Top-level dispatcher. Catches any error from the provider-specific
 * implementations and routes it through `onError` so the Promise from this
 * function always resolves cleanly.
 */
export async function generateStream(
  options: GenerateStreamOptions
): Promise<void> {
  try {
    if (options.provider === "ollama") {
      validateOllamaInputs(options);
      await streamFromOllama(options);
      return;
    }
    if (options.provider === "openrouter") {
      validateOpenRouterInputs(options);
      await streamFromOpenRouter(options);
      return;
    }
    // Exhaustiveness check — fails the build if a new provider is added
    // to the Provider union without a handler here.
    const exhaustive: never = options.provider;
    throw new Error(`Unknown provider: ${String(exhaustive)}`);
  } catch (err) {
    options.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function validateOllamaInputs(options: GenerateStreamOptions): void {
  const { ollamaConfig, messages } = options;
  if (
    typeof ollamaConfig.url !== "string" ||
    ollamaConfig.url.length === 0
  ) {
    throw new Error(
      "Ollama URL is not configured. Set it in Settings before generating."
    );
  }
  if (
    typeof ollamaConfig.model !== "string" ||
    ollamaConfig.model.length === 0
  ) {
    throw new Error("Ollama model is not configured.");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("No messages supplied to generateStream.");
  }
}

function validateOpenRouterInputs(options: GenerateStreamOptions): void {
  const { openrouterConfig, messages } = options;
  if (
    typeof openrouterConfig.model !== "string" ||
    openrouterConfig.model.length === 0
  ) {
    throw new Error(
      "OpenRouter model is not set. Choose a model in Settings before generating."
    );
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("No messages supplied to generateStream.");
  }
}

/* -------------------------------------------------------------------------- */
/* Ollama                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Collapse a messages array into the single-string `prompt` Ollama expects.
 *
 * The original inline call in handleGenerate sent
 *   `${systemPrompt}\n\nUser request: ${userPrompt}`
 * and the original call in handleChatModify sent the raw modify prompt as
 * a single string. Both shapes are preserved here:
 *   - system + user present → preserves the "User request:" join
 *   - user only            → returns the user content verbatim
 *   - anything else        → labelled fallback, never reached by current
 *                            call sites
 */
function joinMessagesForOllama(messages: ChatMessage[]): string {
  const system = messages.find((m) => m.role === "system");
  const user = messages.find((m) => m.role === "user");
  if (system && user) {
    return `${system.content}\n\nUser request: ${user.content}`;
  }
  if (user) {
    return user.content;
  }
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

interface OllamaStreamFrame {
  response?: string;
  done?: boolean;
}

async function streamFromOllama(
  options: GenerateStreamOptions
): Promise<void> {
  const { messages, ollamaConfig, onChunk, onDone, signal } = options;
  const prompt = joinMessagesForOllama(messages);

  const response = await fetch(`${ollamaConfig.url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaConfig.model,
      prompt,
      stream: true,
      options: {
        num_ctx: ollamaConfig.num_ctx,
        temperature: ollamaConfig.temperature,
        top_p: ollamaConfig.top_p,
        top_k: ollamaConfig.top_k,
        repeat_penalty: ollamaConfig.repeat_penalty,
      },
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Ollama request failed: HTTP ${response.status} ${response.statusText}`
    );
  }
  if (response.body === null) {
    throw new Error("Ollama returned an empty response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    // Ollama NDJSON: one complete JSON object per line.
    const lines = buffer.split("\n");
    // The last element may be an incomplete partial line — hold it for the
    // next read iteration instead of trying to parse it.
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.length === 0) {
        continue;
      }
      const fragment = extractOllamaFragment(line);
      if (fragment !== null) {
        fullText += fragment;
        onChunk(fragment, fullText);
      }
    }
  }

  // Flush any trailing buffered line (e.g. the final frame without a newline).
  const tail = buffer.trim();
  if (tail.length > 0) {
    const fragment = extractOllamaFragment(tail);
    if (fragment !== null) {
      fullText += fragment;
      onChunk(fragment, fullText);
    }
  }

  onDone(fullText);
}

function extractOllamaFragment(line: string): string | null {
  try {
    const json = JSON.parse(line) as OllamaStreamFrame;
    if (typeof json.response === "string" && json.response.length > 0) {
      return json.response;
    }
    return null;
  } catch {
    // Malformed JSON line — silently skip, matching original behavior.
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* OpenRouter                                                                 */
/* -------------------------------------------------------------------------- */

interface OpenRouterStreamFrame {
  choices?: Array<{ delta?: { content?: string } }>;
}

async function streamFromOpenRouter(
  options: GenerateStreamOptions
): Promise<void> {
  const { messages, openrouterConfig, onChunk, onDone, signal } = options;

  const hasUserKey =
    typeof openrouterConfig.apiKey === "string" &&
    openrouterConfig.apiKey.length > 0;

  const payload = {
    model: openrouterConfig.model,
    messages,
    stream: true,
    temperature: openrouterConfig.temperature,
    top_p: openrouterConfig.top_p,
    max_tokens: openrouterConfig.max_tokens,
  };

  let response: Response;
  if (hasUserKey) {
    response = await fetch(OPENROUTER_DIRECT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterConfig.apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter attribution. HTTP-Referer is the (mis-)spelled header
        // OpenRouter expects; the browser's own automatic Referer header is
        // separate and unaffected. Falls back to empty string when this code
        // ever runs outside a browser context.
        "HTTP-Referer":
          typeof window !== "undefined" ? window.location.origin : "",
        "X-Title": APP_TITLE,
      },
      body: JSON.stringify(payload),
      signal,
    });
  } else {
    response = await fetch(OPENROUTER_PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  }

  if (!response.ok) {
    throw new Error(await composeOpenRouterErrorMessage(response));
  }
  if (response.body === null) {
    throw new Error("OpenRouter returned an empty response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    // SSE event boundary is a blank line, i.e. two consecutive newlines.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const fragment = extractOpenRouterFragmentFromEvent(event);
      if (fragment !== null) {
        fullText += fragment;
        onChunk(fragment, fullText);
      }
    }
  }

  onDone(fullText);
}

/**
 * Pull the text fragment (if any) out of a single SSE event block.
 * An event block can contain multiple lines (`event:`, `id:`, `data:`,
 * comments starting with `:`). We only care about `data:` lines, and
 * within those we ignore the `[DONE]` sentinel and frames that don't
 * carry a non-empty `choices[0].delta.content`.
 *
 * If a single event contains multiple `data:` lines (rare but legal per
 * SSE), their fragments are concatenated in order.
 */
function extractOpenRouterFragmentFromEvent(event: string): string | null {
  let collected = "";
  for (const rawLine of event.split("\n")) {
    if (!rawLine.startsWith("data:")) {
      continue;
    }
    const data = rawLine.slice("data:".length).trim();
    if (data.length === 0 || data === "[DONE]") {
      continue;
    }
    try {
      const json = JSON.parse(data) as OpenRouterStreamFrame;
      const fragment = json.choices?.[0]?.delta?.content;
      if (typeof fragment === "string" && fragment.length > 0) {
        collected += fragment;
      }
    } catch {
      // Malformed JSON line — silently skip rather than aborting the stream.
    }
  }
  return collected.length > 0 ? collected : null;
}

/**
 * Build a user-facing error message from a non-OK OpenRouter response.
 * Tries JSON first (proxy returns `{ error: "..." }`; OpenRouter direct
 * returns `{ error: { message: "..." } }`), falls back to truncated text.
 */
async function composeOpenRouterErrorMessage(
  response: Response
): Promise<string> {
  const status = `HTTP ${response.status} ${response.statusText}`;
  let detail = "";
  try {
    const body = (await response.json()) as {
      error?: string | { message?: string };
    };
    if (typeof body.error === "string") {
      detail = body.error;
    } else if (
      body.error !== undefined &&
      typeof body.error.message === "string"
    ) {
      detail = body.error.message;
    } else {
      detail = JSON.stringify(body);
    }
  } catch {
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
  }
  const trimmed = detail.slice(0, 300);
  return `OpenRouter request failed: ${status}${
    trimmed.length > 0 ? ` — ${trimmed}` : ""
  }`;
}

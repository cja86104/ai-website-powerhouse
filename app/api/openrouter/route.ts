/**
 * AI Website Powerhouse — OpenRouter Streaming Proxy Route
 *
 * Server-side fallback path for the OpenRouter provider. The browser-side
 * streaming helper (see lib/llm.ts in Section 3) calls this route ONLY when
 * the user has not pasted their own OpenRouter API key into Settings. When a
 * user key is present, the browser calls OpenRouter directly and never hits
 * this route.
 *
 * Responsibilities:
 *   1. Read the host's OpenRouter API key from the OPENROUTER_API_KEY env var.
 *   2. Validate the incoming request body shape (messages[], model, sampling).
 *   3. Forward the request to OpenRouter with attribution headers attached.
 *   4. Stream the upstream SSE response back to the client untouched.
 *   5. Surface clear, non-leaking errors when the key is missing, the body
 *      is malformed, or OpenRouter rejects the request.
 *
 * Rate-limit / abuse posture (NOT YET IMPLEMENTED — flag for the future):
 *   This route is unauthenticated. Any visitor to a deployment that has
 *   OPENROUTER_API_KEY set can spend the host's credits. Before exposing a
 *   public deployment, add:
 *     - per-IP rate limiting
 *     - a daily spend cap (read from env)
 *     - either session auth or a shared-secret header
 *   For private / self-hosted deployments the current implementation is
 *   appropriate as-is.
 */

import type { NextRequest } from "next/server";

/**
 * Use the Node.js runtime (not Edge). The Node runtime gives deterministic
 * streaming behavior and a stable fetch implementation that handles long
 * SSE responses without the per-request CPU caps the Edge runtime imposes.
 */
export const runtime = "nodejs";

/** Prevent any caching of this endpoint at the framework level. */
export const dynamic = "force-dynamic";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_APP_TITLE = "AI Website Powerhouse";

/**
 * Minimal shape of an OpenAI-style chat message. Validated only at the top
 * level; OpenRouter itself is the authority on per-model schema details.
 */
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Body shape accepted by this route. Any extra fields are ignored. */
interface ProxyRequestBody {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

/** Build a JSON error response without leaking environment state. */
function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Validate the incoming body shape. Returns `null` on success or a
 * human-readable error message on failure (caller maps to HTTP 400).
 */
function validateBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object.";
  }
  const b = body as Partial<ProxyRequestBody>;

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return "Field `messages` must be a non-empty array.";
  }
  for (const m of b.messages) {
    if (typeof m !== "object" || m === null) {
      return "Each entry in `messages` must be an object.";
    }
    const mm = m as Partial<ChatMessage>;
    if (
      mm.role !== "system" &&
      mm.role !== "user" &&
      mm.role !== "assistant"
    ) {
      return "Each `messages` entry must have role of system | user | assistant.";
    }
    if (typeof mm.content !== "string" || mm.content.length === 0) {
      return "Each `messages` entry must have non-empty string `content`.";
    }
  }
  if (typeof b.model !== "string" || b.model.length === 0) {
    return "Field `model` must be a non-empty string.";
  }
  if (b.temperature !== undefined && typeof b.temperature !== "number") {
    return "Field `temperature` must be a number when provided.";
  }
  if (b.top_p !== undefined && typeof b.top_p !== "number") {
    return "Field `top_p` must be a number when provided.";
  }
  if (b.max_tokens !== undefined && typeof b.max_tokens !== "number") {
    return "Field `max_tokens` must be a number when provided.";
  }
  if (b.stream !== undefined && typeof b.stream !== "boolean") {
    return "Field `stream` must be a boolean when provided.";
  }
  return null;
}

/**
 * GET /api/openrouter
 * Reports whether the server-side OpenRouter key fallback is configured on
 * this deployment. Used by the Settings panel to render the System Status
 * row for OpenRouter without exposing the key itself.
 *
 * Response: { available: boolean }
 */
export async function GET(): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const available = typeof apiKey === "string" && apiKey.length > 0;
  return new Response(JSON.stringify({ available }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * POST /api/openrouter
 * Forwards a chat-completions request to OpenRouter using the host's
 * server-side key. Streams the upstream SSE response straight back to the
 * caller. Returns JSON error responses for pre-flight failures.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    return errorResponse(
      503,
      "OpenRouter is not configured on this deployment. Paste your own OpenRouter API key in Settings to continue."
    );
  }

  // Parse the incoming body. Reject malformed JSON cleanly.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Request body must be valid JSON.");
  }

  const validationError = validateBody(body);
  if (validationError !== null) {
    return errorResponse(400, validationError);
  }
  const typed = body as ProxyRequestBody;

  // Compose the upstream payload. Default `stream: true` so the existing
  // streaming UI keeps working unless the caller explicitly disables it.
  const upstreamPayload: Record<string, unknown> = {
    model: typed.model,
    messages: typed.messages,
    stream: typed.stream ?? true,
  };
  if (typeof typed.temperature === "number") {
    upstreamPayload.temperature = typed.temperature;
  }
  if (typeof typed.top_p === "number") {
    upstreamPayload.top_p = typed.top_p;
  }
  if (typeof typed.max_tokens === "number") {
    upstreamPayload.max_tokens = typed.max_tokens;
  }

  // Build OpenRouter attribution headers. `HTTP-Referer` and `X-Title` are
  // optional but recommended by OpenRouter. The title falls back to the
  // app's actual name; the referer is only sent when explicitly configured
  // (no fabricated URLs).
  const referer = process.env.OPENROUTER_REFERER;
  const title = process.env.OPENROUTER_TITLE ?? DEFAULT_APP_TITLE;
  const upstreamHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Title": title,
  };
  if (typeof referer === "string" && referer.length > 0) {
    upstreamHeaders["HTTP-Referer"] = referer;
  }

  // Forward to OpenRouter. Propagate the client's abort signal so a
  // disconnected browser tab does not keep streaming bytes we will never
  // deliver. Network-level failures are mapped to 502.
  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamPayload),
      signal: request.signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown upstream error.";
    return errorResponse(502, `Could not reach OpenRouter: ${message}`);
  }

  // Surface upstream errors BEFORE opening the stream. When OpenRouter
  // returns 4xx/5xx, forward the status and a truncated body so the client
  // gets an actionable error instead of an empty event stream.
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return errorResponse(
      upstream.status,
      `OpenRouter request failed (${upstream.status}). ${detail.slice(0, 500)}`
    );
  }

  if (upstream.body === null) {
    return errorResponse(502, "OpenRouter returned an empty response body.");
  }

  // Pass the SSE stream straight through. Preserve the upstream
  // content-type when present, fall back to text/event-stream otherwise.
  // `X-Accel-Buffering: no` prevents reverse-proxy buffering on some hosts.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ??
        "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

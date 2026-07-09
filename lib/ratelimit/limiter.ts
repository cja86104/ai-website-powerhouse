/**
 * AI Website Powerhouse — Upstash rate limiting (W4, ADR-009).
 *
 * Two sliding-window limiters:
 *  - "auth":       10 requests / 10 minutes per IP — sign-in, sign-up,
 *                  and password-reset form posts. Generous for humans,
 *                  hostile to credential stuffing and email-spam loops.
 *  - "generation": 20 requests / 10 minutes per IP — the hosted-key
 *                  proxy. Sits ABOVE the billing quotas as a raw
 *                  abuse ceiling, not a product limit.
 *
 * Fail-open by design: if Upstash is down or unconfigured, requests
 * pass and the error is logged. Availability of the product beats
 * perfection of the limiter; quota enforcement still runs in the
 * billing gate.
 *
 * Runs on the Edge runtime (called from proxy.ts) — @upstash/* is
 * fetch-based and edge-safe.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type LimiterName = "auth" | "generation";

let limiters: Record<LimiterName, Ratelimit> | null = null;

function getLimiters(): Record<LimiterName, Ratelimit> | null {
  if (limiters !== null) return limiters;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url === undefined || url.length === 0 || token === undefined || token.length === 0) {
    return null; // unconfigured → limiting disabled (fail open)
  }

  const redis = new Redis({ url, token });
  limiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      prefix: "aiwp:rl:auth",
    }),
    generation: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      prefix: "aiwp:rl:gen",
    }),
  };
  return limiters;
}

/**
 * Check a limiter. Returns true when the request may proceed.
 * Never throws; failures log and pass.
 */
export async function allowRequest(
  name: LimiterName,
  identifier: string,
): Promise<boolean> {
  try {
    const all = getLimiters();
    if (all === null) return true;
    const { success } = await all[name].limit(identifier);
    return success;
  } catch (error) {
    console.error(`Rate limiter "${name}" failed:`, error);
    return true;
  }
}

/** Best-effort client IP for limiter identity (Edge-safe). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded !== null && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}

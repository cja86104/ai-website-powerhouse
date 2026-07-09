/**
 * AI Website Powerhouse — one-shot Stripe Test-mode catalog setup (W3).
 *
 * Creates the V1 product catalog from PLAN/Section-07 §6 and prints the
 * resulting price IDs as .env.local lines. Idempotent: products are
 * looked up by the `aiwp_key` metadata before creating, prices by
 * (product, nickname), so re-running never duplicates anything.
 *
 * Uses Stripe's REST API directly (form-encoded) so it runs with zero
 * dependencies — the app's runtime code uses the official `stripe` SDK,
 * but this script must work before `npm install stripe` has happened.
 *
 * Usage (PowerShell):
 *   $env:STRIPE_SECRET_KEY="sk_test_..."; node scripts/stripe-setup.mjs
 *
 * Refuses to run against a live key.
 */

const API = "https://api.stripe.com/v1";
const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error("STRIPE_SECRET_KEY is not set. Use your sk_test_ key.");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error(
    "Refusing to run: STRIPE_SECRET_KEY is not a Test-mode key (sk_test_...). " +
      "The catalog is copied to Live mode manually at launch per Section 7.",
  );
  process.exit(1);
}

/** Minimal Stripe REST helper (form-encoded, Basic auth). */
async function stripe(method, path, params) {
  const options = {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };
  if (params) {
    options.body = new URLSearchParams(params).toString();
  }
  const response = await fetch(`${API}${path}`, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed (${response.status}): ${body.error?.message ?? JSON.stringify(body)}`,
    );
  }
  return body;
}

/** Find a product by our aiwp_key metadata, else create it. */
async function ensureProduct(aiwpKey, name) {
  const found = await stripe(
    "GET",
    `/products/search?query=${encodeURIComponent(`metadata['aiwp_key']:'${aiwpKey}'`)}`,
  );
  if (found.data.length > 0) {
    console.log(`product exists:  ${name} (${found.data[0].id})`);
    return found.data[0];
  }
  const created = await stripe("POST", "/products", {
    name,
    "metadata[aiwp_key]": aiwpKey,
  });
  console.log(`product created: ${name} (${created.id})`);
  return created;
}

/** Find a price by (product, nickname), else create it. */
async function ensurePrice(product, nickname, params) {
  const existing = await stripe(
    "GET",
    `/prices?product=${product.id}&limit=100&active=true`,
  );
  const match = existing.data.find((p) => p.nickname === nickname);
  if (match) {
    console.log(`price exists:    ${nickname} (${match.id})`);
    return match;
  }
  const created = await stripe("POST", "/prices", {
    product: product.id,
    nickname,
    currency: "usd",
    ...params,
  });
  console.log(`price created:   ${nickname} (${created.id})`);
  return created;
}

const pro = await ensureProduct("aiwp_pro", "AIWP Pro");
const premium = await ensureProduct(
  "aiwp_premium_gens",
  "AIWP Premium Generations",
);

const proMonthly = await ensurePrice(pro, "Pro Monthly", {
  unit_amount: "1900",
  "recurring[interval]": "month",
});
const proAnnual = await ensurePrice(pro, "Pro Annual", {
  unit_amount: "19000",
  "recurring[interval]": "year",
});

/**
 * Metered premium prices: one product, three prices (Section 7 §6.2).
 *
 * Since Stripe API 2025-03-31.basil, metered prices must be backed by
 * Billing Meters. One meter per model keeps per-model invoice line
 * items; each generation is one meter event (aggregation = count).
 * Usage reporting (LATER phase) posts to /v1/billing/meter_events
 * with the matching event_name and the customer's id.
 */
async function ensureMeter(eventName, displayName) {
  const existing = await stripe("GET", "/billing/meters?status=active&limit=100");
  const match = existing.data.find((m) => m.event_name === eventName);
  if (match) {
    console.log(`meter exists:    ${displayName} (${match.id})`);
    return match;
  }
  const created = await stripe("POST", "/billing/meters", {
    display_name: displayName,
    event_name: eventName,
    "default_aggregation[formula]": "count",
    "customer_mapping[type]": "by_id",
    "customer_mapping[event_payload_key]": "stripe_customer_id",
  });
  console.log(`meter created:   ${displayName} (${created.id})`);
  return created;
}

async function ensureMeteredPrice(product, nickname, unitAmount, eventName, meterDisplayName) {
  const meter = await ensureMeter(eventName, meterDisplayName);
  return ensurePrice(product, nickname, {
    unit_amount: unitAmount,
    "recurring[interval]": "month",
    "recurring[usage_type]": "metered",
    "recurring[meter]": meter.id,
  });
}

const premiumHaiku = await ensureMeteredPrice(
  premium, "Premium — Haiku 4.5", "10",
  "aiwp_premium_haiku", "AIWP Premium — Haiku generations",
);
const premiumSonnet = await ensureMeteredPrice(
  premium, "Premium — Sonnet", "30",
  "aiwp_premium_sonnet", "AIWP Premium — Sonnet generations",
);
const premiumOpus = await ensureMeteredPrice(
  premium, "Premium — Opus", "80",
  "aiwp_premium_opus", "AIWP Premium — Opus generations",
);

console.log("\nAdd these to .env.local:\n");
console.log(`STRIPE_PRICE_ID_PRO_MONTHLY=${proMonthly.id}`);
console.log(`STRIPE_PRICE_ID_PRO_ANNUAL=${proAnnual.id}`);
console.log(`STRIPE_PRICE_ID_PREMIUM_HAIKU=${premiumHaiku.id}`);
console.log(`STRIPE_PRICE_ID_PREMIUM_SONNET=${premiumSonnet.id}`);
console.log(`STRIPE_PRICE_ID_PREMIUM_OPUS=${premiumOpus.id}`);

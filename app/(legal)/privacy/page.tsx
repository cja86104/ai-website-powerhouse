/** Privacy policy (W4). Content drafted from the actual data flows. */

import { LegalShell } from "@/app/(legal)/legal-layout";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 10, 2026">
      <p>
        AI Website Powerhouse (&quot;AIWP&quot;, &quot;we&quot;) is a website
        generation tool. This policy describes exactly what we store, why,
        and who touches it. Short version: we store what the product needs
        to function, we don&apos;t run ads, and we don&apos;t sell data.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          <strong>Account:</strong> your email address and a password hash
          (handled by Supabase Auth — we never see your plaintext password).
        </li>
        <li>
          <strong>Your work:</strong> the prompts you write, the websites the
          AI generates for you, and your chat history, so your projects
          persist across devices.
        </li>
        <li>
          <strong>API keys you choose to save:</strong> encrypted at rest
          with AES-256-GCM before they reach the database. Decrypted only
          server-side, only to make the API call you requested.
        </li>
        <li>
          <strong>Billing:</strong> your subscription status and Stripe
          identifiers. Card numbers never touch our servers — payment
          details go directly to Stripe.
        </li>
        <li>
          <strong>Abuse prevention:</strong> IP addresses are used
          transiently for rate limiting and are not joined to your account
          history.
        </li>
      </ul>

      <h2>Where your prompts go</h2>
      <p>
        Generating a website sends your prompt to an AI model. Which one is
        your choice: with <strong>local Ollama</strong>, nothing leaves your
        machine — we never see the prompt or the output until you save the
        project. With <strong>your own OpenRouter key</strong>, your browser
        talks to OpenRouter directly under their privacy terms. With our
        <strong> hosted option</strong>, the request passes through our
        server to OpenRouter using our key.
      </p>

      <h2>Service providers</h2>
      <ul>
        <li><strong>Supabase</strong> — authentication and database hosting.</li>
        <li><strong>Stripe</strong> — payments, subscriptions, invoices.</li>
        <li><strong>OpenRouter</strong> — AI inference for cloud generations.</li>
        <li><strong>Upstash</strong> — rate-limit counters (no personal content).</li>
        <li>
          <strong>Cloudflare Turnstile</strong> — bot detection at sign-up,
          when enabled on a deployment.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We set strictly-necessary cookies only: the session tokens that keep
        you signed in. No advertising cookies, no cross-site tracking, no
        analytics cookies — which is why there is no cookie consent banner.
        If we ever add opt-in analytics, we will ask first.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        Everything is kept until you delete it. Deleting your account (from
        the Account page, typed confirmation required) permanently removes
        your profile, projects, generations, chat history, and stored keys
        via cascading database deletion. Stripe retains invoice records as
        required by financial regulations.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <strong>cja86104@gmail.com</strong>.
      </p>
    </LegalShell>
  );
}

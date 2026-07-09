/** Terms of service (W4). */

import { LegalShell } from "@/app/(legal)/legal-layout";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 10, 2026">
      <p>
        These terms govern your use of AI Website Powerhouse
        (&quot;AIWP&quot;). By creating an account you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        AIWP generates websites from natural-language prompts using AI
        models you select — your local Ollama server, your own OpenRouter
        account, or our hosted keys within your plan&apos;s limits. Plans
        and current limits are described on the pricing page; paid
        subscriptions are billed through Stripe and can be canceled any
        time from the billing portal, keeping access through the end of
        the paid period.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for your credentials and for activity under
        your account. One person per account. You must be legally able to
        enter this agreement.
      </p>

      <h2>Your content</h2>
      <p>
        You own what you make. Prompts you write and websites you generate
        are yours, including commercially. We claim no rights over your
        outputs beyond what is needed to store and display them back to
        you. AI output can be wrong, insecure, or similar to other
        AI-generated work — review before you ship it. It is provided
        as-is, without warranty.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>No illegal content or use.</li>
        <li>
          No circumventing plan limits, rate limits, or the metering that
          keeps the free tier free (e.g., automating account creation).
        </li>
        <li>
          No probing, scraping, or disrupting the service or other
          users&apos; data.
        </li>
        <li>
          Bring-your-own-key usage must comply with the key provider&apos;s
          own terms.
        </li>
      </ul>
      <p>
        We may suspend accounts that break these rules, with notice where
        practical.
      </p>

      <h2>Self-hosting</h2>
      <p>
        The AIWP codebase is source-available under the Functional Source
        License (FSL-1.1-ALv2). Self-hosting for your own use is welcome;
        offering a competing hosted service is not, until each release
        converts to Apache 2.0 two years after publication. See the LICENSE
        file in the repository.
      </p>

      <h2>Disclaimers and liability</h2>
      <p>
        The service is provided &quot;as is&quot; without warranties of any
        kind. To the maximum extent permitted by law, our total liability
        for any claim is limited to the amount you paid us in the twelve
        months before the claim arose.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; material changes will be announced by
        email or in-app notice at least 14 days before taking effect.
        Continued use after that constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <strong>cja86104@gmail.com</strong>.
      </p>
    </LegalShell>
  );
}

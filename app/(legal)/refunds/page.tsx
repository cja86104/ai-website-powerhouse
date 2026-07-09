/** Refund policy (W4). Aligned with Section 7's honest-pricing stance. */

import { LegalShell } from "@/app/(legal)/legal-layout";

export default function RefundsPage() {
  return (
    <LegalShell title="Refund Policy" updated="July 10, 2026">
      <p>
        Our pricing promise is that your bill never surprises you. The
        refund policy follows the same idea.
      </p>

      <h2>First subscription</h2>
      <p>
        If Pro isn&apos;t what you expected, email us within{" "}
        <strong>14 days of your first charge</strong> (monthly or annual)
        and we&apos;ll refund it in full, no questions asked.
      </p>

      <h2>Renewals</h2>
      <p>
        Renewal charges are generally not refunded — cancel any time before
        renewal from the billing portal and you keep access through the end
        of the period you paid for. If a renewal charged when you clearly
        hadn&apos;t used the service that cycle, email us and we&apos;ll
        make it right.
      </p>

      <h2>Metered premium generations</h2>
      <p>
        Per-generation premium model charges (billed monthly at the
        published per-generation rates) are consumed on use and
        non-refundable, except where a platform failure on our side wasted
        the generation — tell us and we&apos;ll credit it.
      </p>

      <h2>How to request</h2>
      <p>
        Email <strong>cja86104@gmail.com</strong> from your account email
        with the invoice number (in your Stripe receipt). Refunds are
        issued to the original payment method, typically within 5–10
        business days.
      </p>
    </LegalShell>
  );
}

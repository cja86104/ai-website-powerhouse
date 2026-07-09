/**
 * AI Website Powerhouse — disposable-email domain blocklist (W4).
 *
 * Curated list of the highest-volume throwaway-email providers used
 * for free-tier farming. Deliberately small and maintained by hand:
 * a giant list catches more but rots faster and risks false
 * positives. Checked at sign-up only — existing accounts are never
 * retroactively blocked.
 */

const DISPOSABLE_DOMAINS = new Set<string>([
  "10minutemail.com",
  "10minutemail.net",
  "guerrillamail.com",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "sharklasers.com",
  "mailinator.com",
  "maildrop.cc",
  "yopmail.com",
  "yopmail.fr",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.dev",
  "tempmailo.com",
  "throwawaymail.com",
  "getnada.com",
  "nada.email",
  "dispostable.com",
  "mintemail.com",
  "mohmal.com",
  "fakeinbox.com",
  "trashmail.com",
  "trashmail.de",
  "mytemp.email",
  "burnermail.io",
  "spamgourmet.com",
  "mailnesia.com",
  "mailcatch.com",
  "inboxkitten.com",
  "emailondeck.com",
]);

/** True when the address's domain is a known disposable provider. */
export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DISPOSABLE_DOMAINS.has(domain);
}

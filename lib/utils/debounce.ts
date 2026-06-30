/**
 * AI Website Powerhouse — debounce utility
 *
 * Lifted from the legacy `components/AIWebsitePowerhouse.js` monolith as
 * part of the W1 PR-1 extraction. Behavior is preserved verbatim: the
 * returned function clears any pending timer on each call and schedules
 * a fresh invocation `delay` ms in the future. The internal timer state
 * is captured in a closure so each `debounce(...)` call produces an
 * independent debouncer.
 *
 * Typed with a generic argument tuple so call sites get full parameter
 * inference. `this` is forwarded through `.apply` to preserve compatibility
 * with classic (non-arrow) callbacks; in practice every current caller
 * passes an arrow function and ignores `this`.
 */

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return function debounced(this: unknown, ...args: TArgs): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Preview-only number badges for image slots (2026-07-12).
 *
 * Generated sites tag image elements with data-aiwp-slot="N" (see
 * lib/prompts/image-slots.ts). This script — injected ONLY into the
 * preview surfaces, never into saved/deployed files — draws a purple
 * numbered badge over each tagged element so a non-technical user can
 * say "put my photo in spot 7" and mean an exact location.
 *
 * When the document has NO tagged elements (site generated before the
 * slot contract), a corner notice explains that any edit adds the
 * numbers — first user test hit exactly this "nothing shows up"
 * confusion.
 *
 * Implementation: a fixed full-viewport pointer-events:none layer,
 * re-rendered on an 800 ms interval plus scroll/resize, which tracks
 * React re-mounts and layout shifts without a MutationObserver's
 * feedback-loop risk (our own badge writes would retrigger it).
 */

/** IIFE injected into preview documents/modules. */
export const SLOT_BADGE_SCRIPT = `(function () {
  if (window.__aiwpSlotBadges) return;
  window.__aiwpSlotBadges = true;
  var started = Date.now();
  var layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2147483647;';
  function render() {
    if (!document.body) return;
    if (!layer.parentNode) document.body.appendChild(layer);
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    var els = document.querySelectorAll('[data-aiwp-slot]');
    if (els.length === 0) {
      if (Date.now() - started > 2000) {
        var note = document.createElement('div');
        note.textContent = 'No numbered image spots in this version yet - ask for any small change to the site and the numbers will appear.';
        note.style.cssText = 'position:absolute;left:12px;bottom:12px;max-width:320px;padding:10px 14px;border-radius:10px;background:rgba(124,58,237,0.95);color:#fff;font:600 12px/1.5 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.5);';
        layer.appendChild(note);
      }
      return;
    }
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      var b = document.createElement('div');
      b.textContent = el.getAttribute('data-aiwp-slot');
      b.style.cssText = 'position:absolute;left:' + Math.max(0, r.left + 4) + 'px;top:' + Math.max(0, r.top + 4) + 'px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:#7c3aed;color:#fff;font:700 12px/22px system-ui,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.5);';
      layer.appendChild(b);
    }
  }
  setInterval(render, 800);
  window.addEventListener('scroll', render, true);
  window.addEventListener('resize', render);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();`;

/** Injects the badge script into an HTML document string (iframe path). */
export function injectSlotBadges(html: string): string {
  const tag = `<script>${SLOT_BADGE_SCRIPT}</script>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${tag}\n</body>`);
  }
  return `${html}\n${tag}`;
}

/**
 * Appends the badge script to a JS module (Sandpack path). Injection
 * must target a MODULE, not index.html: editing the vite entry module
 * forces a full page reload, so toggling Spots takes effect
 * immediately — the dev server never re-serves index.html for a
 * running preview, which left the badges invisible until a manual
 * refresh (2026-07-12 user report).
 */
export function appendSlotBadges(moduleCode: string): string {
  return `${moduleCode}\n\n;${SLOT_BADGE_SCRIPT}\n`;
}

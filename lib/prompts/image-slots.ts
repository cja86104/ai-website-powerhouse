/**
 * Numbered image slots — the shared prompt contract (2026-07-12,
 * user idea: "give the boxes a number so people can say 'put my dog
 * photo in box 7'").
 *
 * Every image element in generated sites carries an invisible
 * data-aiwp-slot attribute. The PREVIEW draws visible number badges
 * on those elements (lib/preview/slot-badges.ts); the deployed site
 * shows nothing — the attribute is inert metadata. The Your Images
 * panel turns a thumbnail + a number into a precise placement
 * request against these attributes.
 *
 * One constant, imported by every prompt builder, so the contract
 * wording can never drift between generate and modify.
 */

export const IMAGE_SLOT_RULES = `IMAGE SLOTS (AIWP editor contract):
- Give EVERY image element a data-aiwp-slot attribute numbered sequentially from 1 in page order: <img data-aiwp-slot="3" src="...">
- If an element shows a CSS background image, put the attribute on that element instead
- Numbers are unique across the whole site; when modifying, keep every existing number unchanged and give NEW image elements the next unused numbers
- These attributes are invisible editor metadata: never remove them and never show the numbers in visible text
- When the user asks to put an image in "spot N" or "box N", set the src (or background-image) of the element whose data-aiwp-slot equals N to the exact image URL provided. The image must FIT INSIDE the element's existing box: keep the container's width/height/layout classes unchanged and make the image fill it (w-full h-full object-cover, or background-size cover) — never let a placed image enlarge its container or the page`;

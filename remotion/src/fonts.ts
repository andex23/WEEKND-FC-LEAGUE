import {
  ROBOTO_400,
  ROBOTO_500,
  ROBOTO_700,
  ROBOTO_900,
  MONO_400,
  MONO_500,
  MONO_700,
} from "./fonts-data";

// Fonts are base64-embedded (scripts/embed-fonts.mjs) and registered with a
// SYNCHRONOUS @font-face <style> injection from data: URIs.
//
// No delayRender(), no async font loading, no network. This matters: Remotion
// reloads the render tab in chunks, re-evaluating this module each time. A
// delayRender tied to an async font load can stall a reloaded tab forever
// (the promise never settles → render times out). Pure synchronous injection
// can never stall, is idempotent across reloads, and decodes instantly because
// the woff2 is inline. font-display:block keeps type consistent; Remotion waits
// for document.fonts before capturing each frame.
type Face = { family: string; weight: number; src: string };

const FACES: Face[] = [
  { family: "Roboto", weight: 400, src: ROBOTO_400 },
  { family: "Roboto", weight: 500, src: ROBOTO_500 },
  { family: "Roboto", weight: 700, src: ROBOTO_700 },
  { family: "Roboto", weight: 900, src: ROBOTO_900 },
  { family: "Roboto Mono", weight: 400, src: MONO_400 },
  { family: "Roboto Mono", weight: 500, src: MONO_500 },
  { family: "Roboto Mono", weight: 700, src: MONO_700 },
];

if (typeof document !== "undefined") {
  const ID = "weekendfc-fonts";
  if (!document.getElementById(ID)) {
    const style = document.createElement("style");
    style.id = ID;
    style.textContent = FACES.map(
      (f) =>
        `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};font-display:block;src:url(${f.src}) format('woff2');}`,
    ).join("");
    document.head.appendChild(style);
  }

  // Kick decoding immediately — fire-and-forget (data: URIs decode without a
  // network round-trip). Never awaited, so it can never block a render.
  const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (fontSet && typeof fontSet.load === "function") {
    for (const f of FACES) {
      try {
        void fontSet.load(`${f.weight} 40px '${f.family}'`);
      } catch {
        /* ignore — fall back to the system stacks below */
      }
    }
  }
}

export const HEADING = `"Roboto", "Arial Black", system-ui, sans-serif`;
export const SANS = `"Roboto", system-ui, -apple-system, sans-serif`;
export const MONO = `"Roboto Mono", "Courier New", ui-monospace, monospace`;

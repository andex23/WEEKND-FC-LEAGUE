import { continueRender, delayRender } from "remotion";
import {
  ROBOTO_400,
  ROBOTO_500,
  ROBOTO_700,
  ROBOTO_900,
  MONO_400,
  MONO_500,
  MONO_700,
} from "./fonts-data";

// Fonts are base64-embedded (scripts/embed-fonts.mjs) and registered via the
// FontFace API straight from data: URIs — no render-time fetch and no reliance
// on document.fonts.ready (which can hang in recycled render tabs). The
// delayRender handle is always cleared in `finally`, so a render can never
// stall on fonts, while still waiting for them so type is consistent.
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

const handle = delayRender("Loading Weekend FC fonts", {
  timeoutInMilliseconds: 30000,
});

(async () => {
  try {
    if (typeof document !== "undefined" && "fonts" in document) {
      await Promise.all(
        FACES.map((f) => {
          const face = new FontFace(f.family, `url(${f.src}) format("woff2")`, {
            weight: String(f.weight),
            style: "normal",
            display: "block",
          });
          document.fonts.add(face);
          return face.load();
        }),
      );
    }
  } catch {
    // ignore — fall back to system fonts in the stacks below
  } finally {
    continueRender(handle);
  }
})();

export const HEADING = `"Roboto", "Arial Black", system-ui, sans-serif`;
export const SANS = `"Roboto", system-ui, -apple-system, sans-serif`;
export const MONO = `"Roboto Mono", "Courier New", ui-monospace, monospace`;

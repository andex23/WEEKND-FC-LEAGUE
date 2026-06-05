// ── Canvas ────────────────────────────────────────────────────────────────
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const SCENE = 90; // 3 seconds per scene
export const DURATION = SCENE * 5; // 450 frames = 15s

// Vertical "safe area" insets so nothing important sits where a phone / social
// player crops or overlays UI (caption bars, buttons). Bottom is larger.
export const SAFE_TOP = 120;
export const SAFE_BOTTOM = 200;

// ── Brand palette ───────────────────────────────────────────────────────────
// Pulled straight from the live weekendfc.online design tokens so the trailer
// matches the real product (dark UI, emerald primary, amber/gold accent).
export const C = {
  bg: "#0A0A0A",
  bgDeep: "#060606",
  card: "#111111",
  cardDeep: "#0D0D0D",
  cardDeeper: "#0F0F0F",
  border: "#1E1E1E",
  borderSoft: "#1A1A1A",

  white: "#FFFFFF",
  text: "#ECECEC",
  textMuted: "#C8C8C8",
  textDim: "#9E9E9E",
  textFaint: "#7A7A7A",

  emerald: "#10B981",
  emeraldLight: "#34D399",
  emeraldDark: "#0F8A45",

  amber: "#F5C54A",
  amberLight: "#FBBF24",
  amberDeep: "#BD8F3E",

  sky: "#38BDF8",
  rose: "#FB7185",
} as const;

// gold → green, the brand's primary CTA gradient
export const CTA_GRADIENT = "linear-gradient(90deg, #F5C54A 0%, #10B981 100%)";

export function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

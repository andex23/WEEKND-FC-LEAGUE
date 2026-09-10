import React from "react";
import { C, rgba } from "../theme";
import { HEADING } from "../fonts";

/**
 * Lightweight club crest: a colored monogram coin. Mirrors the app's
 * initials-fallback for team badges (no external badge fetches needed).
 */
export const Crest: React.FC<{
  team: string;
  color?: string;
  size?: number;
}> = ({ team, color = C.emerald, size = 40 }) => {
  const initials =
    team
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at 50% 30%, ${rgba(color, 0.28)}, ${C.cardDeep})`,
        border: `1.5px solid ${rgba(color, 0.45)}`,
        fontFamily: HEADING,
        fontWeight: 900,
        fontSize: size * 0.36,
        color: C.white,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
};

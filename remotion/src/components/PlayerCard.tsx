import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, rgba } from "../theme";
import { HEADING, MONO } from "../fonts";

const GOLD_BORDER = "linear-gradient(160deg,#F6DD93,#BD8F3E 38%,#6A4D1A 72%,#241A09)";
const EMERALD_BORDER = "linear-gradient(160deg,#54F08F,#0F8A45 48%,#0A3D22)";
const INNER = "linear-gradient(168deg,#352C19 0%,#1F1B12 26%,#111111 60%,#0A0A0A 100%)";

interface Stat {
  label: string;
  value: string | number;
}

interface PlayerCardProps {
  name?: string;
  handle?: string;
  ovr?: number;
  tier?: string;
  consoleType?: string;
  monogram?: string;
  stats?: Stat[];
  /** 0 = gold "draft" card, 1 = fully minted emerald card */
  mint?: number;
  width?: number;
  floatPhase?: number;
  style?: React.CSSProperties;
}

const DEFAULT_STATS: Stat[] = [
  { label: "GP", value: 24 },
  { label: "W", value: 20 },
  { label: "D", value: 2 },
  { label: "L", value: 2 },
  { label: "GLS", value: 78 },
  { label: "AST", value: 41 },
];

/** FUT-style player card, ported from components/player-card.tsx. */
export const PlayerCard: React.FC<PlayerCardProps> = ({
  name = "League MVP",
  handle = "weekendfc",
  ovr = 99,
  tier = "Icon",
  consoleType = "PS5",
  monogram,
  stats = DEFAULT_STATS,
  mint = 0,
  width = 460,
  floatPhase = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const k = width / 460; // scale factor
  const radius = 34 * k;

  const mono =
    monogram ??
    (name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") ||
      "★");

  // looping shine sweep
  const period = 150;
  const t = ((frame % period) + period) % period;
  const shine = interpolate(t, [0, period * 0.55, period], [-130, 130, 130]);

  // gentle float on the monogram
  const float = Math.sin(frame * 0.05 + floatPhase) * 7 * k;

  const accent = mint > 0.5 ? C.emeraldLight : C.amberLight;

  return (
    <div style={{ position: "relative", width, ...style }}>
      {/* glow (amber → emerald) */}
      <div
        style={{
          position: "absolute",
          inset: -34 * k,
          borderRadius: radius + 34 * k,
          filter: `blur(${40 * k}px)`,
          background: rgba(C.amber, 0.14),
          opacity: 1 - mint,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -34 * k,
          borderRadius: radius + 34 * k,
          filter: `blur(${40 * k}px)`,
          background: rgba(C.emerald, 0.34),
          opacity: mint,
        }}
      />

      {/* gradient border box */}
      <div
        style={{
          position: "relative",
          borderRadius: radius,
          padding: 2.5 * k,
          background: GOLD_BORDER,
          boxShadow: `0 ${30 * k}px ${70 * k}px -${26 * k}px ${rgba("#000", 0.9)}`,
        }}
      >
        {/* emerald border cross-fade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: EMERALD_BORDER,
            opacity: mint,
          }}
        />

        {/* inner card */}
        <div
          style={{
            position: "relative",
            borderRadius: radius - 2 * k,
            background: INNER,
            overflow: "hidden",
            padding: `${26 * k}px ${24 * k}px ${24 * k}px`,
          }}
        >
          {/* top tint */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(120% 58% at 50% 0%, ${rgba(
                mint > 0.5 ? C.emerald : "#F6DD93",
                0.18,
              )}, transparent 62%)`,
              opacity: 0.8,
            }}
          />

          {/* shine sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.42) 48%, rgba(255,255,255,0.1) 54%, transparent 60%)",
              transform: `translateX(${shine}%)`,
            }}
          />

          {/* header: OVR + console/crest */}
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: HEADING,
                  fontWeight: 900,
                  fontSize: 74 * k,
                  lineHeight: 1,
                  color: mint > 0.5 ? "#D9FBE9" : "#FBEFC8",
                }}
              >
                {ovr}
              </div>
              <div
                style={{
                  marginTop: 4 * k,
                  fontFamily: HEADING,
                  fontWeight: 700,
                  fontSize: 16 * k,
                  letterSpacing: "0.22em",
                  color: rgba(accent, 0.85),
                }}
              >
                OVR
              </div>
              <div style={{ margin: `${6 * k}px 0`, width: 36 * k, height: 1.5, background: rgba(accent, 0.45) }} />
              <div
                style={{
                  fontFamily: HEADING,
                  fontWeight: 700,
                  fontSize: 15 * k,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: rgba(accent, 0.8),
                }}
              >
                {tier}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 * k }}>
              <div
                style={{
                  width: 64 * k,
                  height: 64 * k,
                  borderRadius: "50%",
                  border: `1.5px solid ${rgba(accent, 0.4)}`,
                  background: rgba("#000", 0.5),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30 * k,
                }}
              >
                ⚽
              </div>
              <span
                style={{
                  borderRadius: 6 * k,
                  padding: `${4 * k}px ${12 * k}px`,
                  fontFamily: HEADING,
                  fontWeight: 700,
                  fontSize: 15 * k,
                  letterSpacing: "0.16em",
                  background: rgba(accent, 0.16),
                  color: mint > 0.5 ? "#D9FBE9" : "#FBEFC8",
                }}
              >
                {consoleType}
              </span>
            </div>
          </div>

          {/* monogram */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: 6 * k }}>
            <div
              style={{
                transform: `translateY(${float}px)`,
                width: 158 * k,
                height: 158 * k,
                borderRadius: "50%",
                background: `radial-gradient(circle at 50% 38%, ${rgba(
                  mint > 0.5 ? C.emerald : "#F6DD93",
                  0.22,
                )}, transparent 68%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 136 * k,
                  height: 136 * k,
                  borderRadius: "50%",
                  border: `1.5px solid ${rgba(accent, 0.28)}`,
                  background: "linear-gradient(to bottom,#211D12,#0C0C0C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: HEADING,
                  fontWeight: 900,
                  fontSize: 64 * k,
                  color: "#FBF6E6",
                }}
              >
                {mono}
              </div>
            </div>
          </div>

          {/* name */}
          <div style={{ position: "relative", textAlign: "center", marginTop: 10 * k }}>
            <div
              style={{
                fontFamily: HEADING,
                fontWeight: 700,
                fontSize: 34 * k,
                letterSpacing: "0.04em",
                color: C.white,
                textTransform: "uppercase",
              }}
            >
              {name}
            </div>
            <div style={{ marginTop: 2 * k, fontFamily: MONO, fontSize: 18 * k, color: rgba(accent, 0.7) }}>
              @{handle}
            </div>
          </div>

          {/* divider */}
          <div
            style={{
              position: "relative",
              margin: `${16 * k}px 0`,
              height: 1.5,
              background: `linear-gradient(90deg, transparent, ${rgba(accent, 0.5)}, transparent)`,
            }}
          />

          {/* stats grid */}
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10 * k,
            }}
          >
            {stats.slice(0, 6).map((s) => (
              <div
                key={s.label}
                style={{
                  borderRadius: 10 * k,
                  border: `1px solid ${rgba(accent, 0.14)}`,
                  background: rgba("#000", 0.32),
                  padding: `${10 * k}px ${6 * k}px`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: HEADING, fontWeight: 900, fontSize: 28 * k, color: mint > 0.5 ? "#D9FBE9" : "#FBEFC8" }}>
                  {s.value}
                </div>
                <div
                  style={{
                    marginTop: 4 * k,
                    fontFamily: HEADING,
                    fontWeight: 700,
                    fontSize: 13 * k,
                    letterSpacing: "0.12em",
                    color: rgba(accent, 0.55),
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* footer */}
          <div style={{ position: "relative", marginTop: 18 * k, display: "flex", alignItems: "center", gap: 10 * k }}>
            <div style={{ flex: 1, height: 1, background: rgba(accent, 0.2) }} />
            <span style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 14 * k, letterSpacing: "0.24em", color: rgba(accent, 0.6) }}>
              WEEKEND FC · S1
            </span>
            <div style={{ flex: 1, height: 1, background: rgba(accent, 0.2) }} />
          </div>

          {/* MINTED stamp */}
          {mint > 0.55 && (
            <div
              style={{
                position: "absolute",
                top: "34%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                opacity: interpolate(mint, [0.55, 0.8], [0, 1], { extrapolateRight: "clamp" }),
                transform: `rotate(-12deg) scale(${interpolate(mint, [0.55, 0.85], [0.6, 1], {
                  extrapolateRight: "clamp",
                })})`,
              }}
            >
              <div
                style={{
                  border: `2.5px solid ${rgba(C.emeraldLight, 0.9)}`,
                  borderRadius: 8 * k,
                  padding: `${6 * k}px ${16 * k}px`,
                  background: rgba("#000", 0.45),
                  fontFamily: HEADING,
                  fontWeight: 900,
                  fontSize: 26 * k,
                  letterSpacing: "0.2em",
                  color: C.emeraldLight,
                }}
              >
                MINTED
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

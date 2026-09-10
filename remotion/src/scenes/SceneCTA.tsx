import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, rgba, CTA_GRADIENT, SAFE_TOP, SAFE_BOTTOM } from "../theme";
import { HEADING, MONO } from "../fonts";
import { useScene } from "../useScene";
import { Reveal } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { Logo } from "../components/Logo";

/** 12–15s · Clean closing CTA frame (held to the end). */
export const SceneCTA: React.FC = () => {
  const { enter } = useScene({ out: 0 }); // hold — no exit fade
  const frame = useCurrentFrame();

  const float = Math.sin(frame * 0.05) * 8;
  const pulse = 1 + Math.sin(frame * 0.12) * 0.02;

  // looping shine across the button
  const period = 80;
  const t = ((frame % period) + period) % period;
  const shine = interpolate(t, [0, period], [-140, 140]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: enter, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM, boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 90px" }}>
        <Reveal delay={2} y={30} scaleFrom={0.84} blur={12} style={{ transform: `translateY(${float}px)` }}>
          <Logo size={360} />
        </Reveal>

        <Reveal delay={12} y={22} style={{ marginTop: 56 }}>
          <Pill fontSize={28}>Season 1 Open</Pill>
        </Reveal>

        <Reveal delay={18} y={26} blur={8} style={{ marginTop: 40 }}>
          <div
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 72,
              letterSpacing: "0.02em",
              color: C.white,
            }}
          >
            weekendfc<span style={{ color: C.emeraldLight }}>.online</span>
          </div>
        </Reveal>

        <Reveal delay={26} y={30} scaleFrom={0.9} blur={10} style={{ marginTop: 52 }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "28px 64px",
              borderRadius: 18,
              background: CTA_GRADIENT,
              color: "#06130C",
              fontFamily: HEADING,
              fontWeight: 900,
              fontSize: 42,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              transform: `scale(${pulse})`,
              boxShadow: `0 24px 70px -18px ${rgba(C.emerald, 0.7)}`,
            }}
          >
            Register Now →
            {/* shine sweep */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 48%, transparent 56%)",
                transform: `translateX(${shine}%)`,
              }}
            />
          </div>
        </Reveal>

        <Reveal delay={34} y={18} style={{ marginTop: 44 }}>
          <div style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", color: C.textDim }}>
            Clubs Only · Weekend Matches · Round-Robin
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

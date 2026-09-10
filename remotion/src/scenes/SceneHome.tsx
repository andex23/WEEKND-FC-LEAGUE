import React from "react";
import { AbsoluteFill } from "remotion";
import { C, rgba, SAFE_TOP, SAFE_BOTTOM } from "../theme";
import { HEADING, MONO } from "../fonts";
import { useScene } from "../useScene";
import { Reveal } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { Logo } from "../components/Logo";

const CHIPS = ["Clubs Only", "Weekend Matches", "Round-Robin"];

/** 0–3s · Brand open: logo medallion + "Online EA FC League". */
export const SceneHome: React.FC = () => {
  const { appear, through } = useScene();

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: appear,
        paddingTop: SAFE_TOP,
        paddingBottom: SAFE_BOTTOM,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 90px",
          // slow Ken-Burns push-in
          transform: `scale(${1 + through * 0.05})`,
        }}
      >
        <Reveal delay={2} y={-18} blur={6}>
          <Pill fontSize={26}>EA FC · Weekend League</Pill>
        </Reveal>

        <Reveal delay={8} y={36} scaleFrom={0.82} blur={14} style={{ marginTop: 56 }}>
          <Logo size={400} />
        </Reveal>

        <Reveal delay={20} y={34} blur={10} style={{ marginTop: 64 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: HEADING,
              fontWeight: 900,
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: C.white,
            }}
          >
            Online <span style={{ color: C.emeraldLight }}>EA FC</span>
            <br />
            League
          </h1>
        </Reveal>

        <Reveal delay={28} y={26} style={{ marginTop: 34 }}>
          <p
            style={{
              margin: 0,
              maxWidth: 760,
              fontFamily: MONO,
              fontSize: 32,
              lineHeight: 1.5,
              color: C.textMuted,
            }}
          >
            Compete every weekend. Build your card. Climb the table.
          </p>
        </Reveal>

        <Reveal delay={36} y={22} style={{ marginTop: 48 }}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
            {CHIPS.map((c) => (
              <div
                key={c}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  padding: "14px 22px",
                  fontFamily: HEADING,
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: C.emeraldLight,
                    boxShadow: `0 0 12px ${rgba(C.emerald, 0.9)}`,
                  }}
                />
                {c}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

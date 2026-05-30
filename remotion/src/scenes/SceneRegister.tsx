import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, rgba, CTA_GRADIENT } from "../theme";
import { HEADING, MONO } from "../fonts";
import { useScene } from "../useScene";
import { Reveal } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { DeviceFrame } from "../components/DeviceFrame";
import { PlayerCard } from "../components/PlayerCard";

const NAME = "Marcus";

/** 3–6s · Zoom into the registration page; a card mints as you sign up. */
export const SceneRegister: React.FC = () => {
  const { appear, through } = useScene();
  const frame = useCurrentFrame();

  // live-typing the display name
  const typed = Math.floor(
    interpolate(frame, [16, 40], [0, NAME.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const nameValue = NAME.slice(0, typed);
  const caret = frame % 16 < 8 ? 1 : 0;

  // card minting after the form is filled
  const mint = interpolate(frame, [44, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // smooth push-in toward the form
  const zoom = 0.9 + through * 0.12;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: appear }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: `scale(${zoom})`,
        }}
      >
        <Reveal delay={2} y={-16}>
          <Pill fontSize={24}>New Player Registration</Pill>
        </Reveal>

        <Reveal delay={6} y={28} blur={10} style={{ marginTop: 30 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: HEADING,
              fontWeight: 900,
              fontSize: 78,
              textTransform: "uppercase",
              color: C.white,
              letterSpacing: "-0.01em",
            }}
          >
            Register from <span style={{ color: C.emeraldLight }}>home</span>
          </h2>
        </Reveal>

        <Reveal delay={12} y={40} blur={12} style={{ marginTop: 44 }}>
          <DeviceFrame url="weekendfc.online/register" width={940}>
            <div style={{ display: "flex", gap: 40, padding: 48 }}>
              {/* form */}
              <div style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: 26 }}>
                <div style={{ fontFamily: HEADING, fontWeight: 900, fontSize: 38, color: C.white, textTransform: "uppercase" }}>
                  Create your player
                </div>

                <Field label="Display name">
                  <span style={{ color: C.white }}>{nameValue}</span>
                  <span style={{ opacity: caret, color: C.emeraldLight, fontWeight: 700 }}>|</span>
                </Field>

                <Field label="Gamertag">
                  <span style={{ color: C.textMuted }}>@marcus_w</span>
                </Field>

                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <FieldLabel>Club</FieldLabel>
                    <div style={selectStyle}>
                      <span style={{ color: C.white }}>Arsenal</span>
                      <span style={{ color: C.textFaint }}>▾</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel>Console</FieldLabel>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      {["PS5", "Xbox", "PC"].map((p, i) => (
                        <div
                          key={p}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "12px 0",
                            borderRadius: 10,
                            fontFamily: HEADING,
                            fontWeight: 700,
                            fontSize: 22,
                            letterSpacing: "0.06em",
                            background: i === 0 ? C.emerald : C.bg,
                            color: i === 0 ? "#04130C" : C.textDim,
                            border: `1px solid ${i === 0 ? C.emerald : C.border}`,
                          }}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* submit */}
                <div
                  style={{
                    marginTop: 8,
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "18px 34px",
                    borderRadius: 12,
                    background: CTA_GRADIENT,
                    color: "#06130C",
                    fontFamily: HEADING,
                    fontWeight: 900,
                    fontSize: 26,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    transform: `scale(${interpolate(frame, [40, 46, 52], [1, 0.96, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })})`,
                    boxShadow: `0 18px 50px -16px ${rgba(C.emerald, 0.6)}`,
                  }}
                >
                  Create your player →
                </div>
              </div>

              {/* card preview */}
              <div style={{ width: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PlayerCard
                  name="Marcus"
                  handle="marcus_w"
                  ovr={84}
                  tier={mint > 0.5 ? "Pro" : "Rookie"}
                  consoleType="PS5"
                  width={320}
                  mint={mint}
                  stats={[
                    { label: "GP", value: 0 },
                    { label: "W", value: 0 },
                    { label: "D", value: 0 },
                    { label: "L", value: 0 },
                    { label: "GLS", value: 0 },
                    { label: "AST", value: 0 },
                  ]}
                />
              </div>
            </div>
          </DeviceFrame>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: HEADING,
      fontWeight: 700,
      fontSize: 18,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: C.textFaint,
    }}
  >
    {children}
  </div>
);

const inputBox: React.CSSProperties = {
  marginTop: 12,
  height: 60,
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "0 18px",
  borderRadius: 10,
  background: C.bg,
  border: `1px solid ${C.border}`,
  fontFamily: MONO,
  fontSize: 26,
};

const selectStyle: React.CSSProperties = {
  ...inputBox,
  justifyContent: "space-between",
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div style={inputBox}>{children}</div>
  </div>
);

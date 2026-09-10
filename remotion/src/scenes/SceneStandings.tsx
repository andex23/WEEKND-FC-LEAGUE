import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, rgba, SAFE_TOP, SAFE_BOTTOM } from "../theme";
import { HEADING, MONO } from "../fonts";
import { EASE_IN_OUT } from "../anim";
import { useScene } from "../useScene";
import { Reveal } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { Crest } from "../components/Crest";

type Res = "W" | "D" | "L";

interface Row {
  name: string;
  club: string;
  color: string;
  p: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  form: Res[];
  startSlot: number;
  endSlot: number;
  hl?: boolean;
}

const ROWS: Row[] = [
  { name: "Sofia", club: "Chelsea", color: "#3B82F6", p: 10, w: 6, d: 2, l: 2, pts: 20, form: ["W", "W", "D", "L", "W"], startSlot: 0, endSlot: 1 },
  { name: "Leo", club: "Man City", color: "#38BDF8", p: 10, w: 6, d: 1, l: 3, pts: 19, form: ["L", "W", "W", "D", "W"], startSlot: 1, endSlot: 2 },
  { name: "Diego", club: "Barcelona", color: "#A855F7", p: 10, w: 6, d: 1, l: 3, pts: 19, form: ["W", "L", "W", "W", "D"], startSlot: 2, endSlot: 3 },
  { name: "Marcus", club: "Arsenal", color: "#EF4444", p: 10, w: 6, d: 3, l: 1, pts: 21, form: ["W", "W", "W", "D", "W"], startSlot: 3, endSlot: 0, hl: true },
  { name: "Yuki", club: "PSG", color: "#6366F1", p: 10, w: 4, d: 3, l: 3, pts: 15, form: ["D", "L", "W", "D", "W"], startSlot: 4, endSlot: 4 },
  { name: "Ade", club: "Liverpool", color: "#F43F5E", p: 10, w: 4, d: 1, l: 5, pts: 13, form: ["L", "W", "L", "D", "L"], startSlot: 5, endSlot: 5 },
];

const ROW_H = 96;
const HEAD_H = 60;

/** 9–12s · League table; the highlighted player climbs to the top. */
export const SceneStandings: React.FC = () => {
  const { appear } = useScene({ out: 10 }); // hold the final table a touch longer
  const frame = useCurrentFrame();

  // climb progress — eased and unhurried (starts once the table has settled)
  const climb = interpolate(frame, [30, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_IN_OUT,
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: appear, paddingTop: SAFE_TOP, paddingBottom: SAFE_BOTTOM, boxSizing: "border-box" }}>
      <div style={{ width: 960, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal delay={2} y={-16}>
          <Pill fontSize={24} icon={<span style={{ fontSize: 22 }}>🏆</span>} dot={false}>
            League Table
          </Pill>
        </Reveal>

        <Reveal delay={6} y={28} blur={10} style={{ marginTop: 26 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: HEADING,
              fontWeight: 900,
              fontSize: 70,
              lineHeight: 1.05,
              textTransform: "uppercase",
              color: C.white,
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            Report scores.
            <br />
            <span style={{ color: C.emeraldLight }}>Climb the table.</span>
          </h2>
        </Reveal>

        <Reveal delay={10} y={36} blur={12} style={{ marginTop: 44, width: "100%" }}>
          <div
            style={{
              width: "100%",
              borderRadius: 22,
              border: `1px solid ${C.border}`,
              background: C.card,
              overflow: "hidden",
              boxShadow: `0 40px 100px -40px ${rgba("#000", 0.85)}`,
            }}
          >
            {/* header */}
            <div
              style={{
                height: HEAD_H,
                display: "flex",
                alignItems: "center",
                padding: "0 28px",
                background: C.cardDeep,
                borderBottom: `1px solid ${C.border}`,
                fontFamily: HEADING,
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.textFaint,
              }}
            >
              <div style={{ width: 70 }}>#</div>
              <div style={{ flex: 1 }}>Player</div>
              <div style={{ width: 180, textAlign: "center" }}>Form</div>
              <Col>P</Col>
              <Col>W</Col>
              <Col>D</Col>
              <Col>L</Col>
              <div style={{ width: 90, textAlign: "right" }}>Pts</div>
            </div>

            {/* rows */}
            <div style={{ position: "relative", height: ROW_H * ROWS.length }}>
              {ROWS.map((row, i) => {
                const slot = row.startSlot + (row.endSlot - row.startSlot) * climb;
                const rank = Math.round(slot) + 1;
                const pts = row.hl ? Math.round(interpolate(frame, [30, 66], [18, row.pts], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : row.pts;
                const lift = row.hl ? interpolate(frame, [30, 54, 72], [0, 1, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
                return (
                  <TableRow key={i} row={row} top={slot * ROW_H} rank={rank} pts={pts} lift={lift} />
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const Col: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 64, textAlign: "center" }}>{children}</div>
);

const TableRow: React.FC<{ row: Row; top: number; rank: number; pts: number; lift: number }> = ({
  row,
  top,
  rank,
  pts,
  lift,
}) => {
  const hl = !!row.hl;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        height: ROW_H,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        borderTop: `1px solid ${C.borderSoft}`,
        // opaque base on the climbing row so it cleanly occludes rows it passes
        background: hl
          ? `linear-gradient(90deg, ${rgba(C.emerald, 0.2 + lift * 0.14)}, ${rgba(C.emerald, 0.05)}), ${C.card}`
          : rank <= 3
            ? rgba(C.emerald, 0.03)
            : "transparent",
        boxShadow: hl
          ? `inset 4px 0 0 ${C.emerald}, inset 0 0 0 1px ${rgba(C.emerald, 0.25)}, 0 ${12 + 18 * lift}px ${
              36 + 24 * lift
            }px -12px ${rgba(C.emerald, 0.55)}, 0 6px 20px -8px rgba(0,0,0,0.7)`
          : "none",
        transform: `scale(${1 + lift * 0.025})`,
        zIndex: hl ? 5 : 1,
      }}
    >
      {/* rank */}
      <div style={{ width: 70, display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: HEADING,
            fontWeight: 900,
            fontSize: 30,
            color: rank === 1 ? C.amberLight : rank <= 3 ? C.white : C.textDim,
          }}
        >
          {rank}
        </span>
        {hl && (
          <span style={{ color: C.emeraldLight, fontSize: 22, opacity: lift }}>▲</span>
        )}
      </div>

      {/* player */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <Crest team={row.club} color={row.color} size={48} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 28, color: C.white }}>{row.name}</div>
          <div style={{ fontFamily: MONO, fontSize: 18, color: C.textFaint }}>{row.club}</div>
        </div>
      </div>

      {/* form */}
      <div style={{ width: 180, display: "flex", justifyContent: "center", gap: 8 }}>
        {row.form.map((r, i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: r === "W" ? C.emerald : r === "D" ? C.amber : C.rose,
            }}
          />
        ))}
      </div>

      <Stat>{row.p}</Stat>
      <Stat color={C.emeraldLight}>{row.w}</Stat>
      <Stat color={C.amberLight}>{row.d}</Stat>
      <Stat color={C.rose}>{row.l}</Stat>
      <div style={{ width: 90, textAlign: "right", fontFamily: HEADING, fontWeight: 900, fontSize: 32, color: hl ? C.emeraldLight : C.white }}>
        {pts}
      </div>
    </div>
  );
};

const Stat: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.textMuted }) => (
  <div style={{ width: 64, textAlign: "center", fontFamily: MONO, fontSize: 26, color }}>{children}</div>
);
